(function() {

g13 = window.g13 || {};
g13["Editor"] = Editor;

window.requestAnimationFrame = (
	window.requestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(f) { setTimeout(f, 16); }
);

var cache = {
	matrix: mat3.create()
};

function Editor()
{
	var self = this;

	this.map = null;

	this.canvas = document.createElement("canvas");
	this.update = function() { self.draw(); self.invalidated = false; };
	this.invalidated = false;

	gfx.initialize(this.canvas, {alpha: false, antialias: false});
	gfx.bgcolor(0xC0, 0xC0, 0xC0, 1);
	gfx.pointSize(7);

	this.framebuffer = null;
	this.screenQuad = new gfx.Sprite();

	var loadCount = 0;

	function resourceLoaded()
	{
		if (--loadCount === 0)
			self.event({type: "load"});
	}

	this.resources = {
		"soldier": (function() {
			var tx = new gfx.Texture("res/soldier.png");
			tx.filter(gfx.LinearMipmapLinear, gfx.Linear);
			tx.generateMipmap();
			tx.onload = resourceLoaded;

			loadCount++;

			return tx;
		})(),
		"rock": (function() {
			var tx = new gfx.Texture("res/rock.png");
			tx.filter(gfx.LinearMipmapLinear, gfx.Linear);
			tx.wrap(gfx.Repeat, gfx.Repeat);
			tx.generateMipmap();
			tx.onload = resourceLoaded;

			loadCount++;

			return tx;
		})(),
		"grass": (function() {
			var spritesheet = {};

			spritesheet.texture = new gfx.Texture("res/grass.png");
			spritesheet.texture.filter(gfx.LinearMipmapLinear, gfx.Linear);
			spritesheet.texture.generateMipmap();
			spritesheet.texture.onload = resourceLoaded;

			loadCount += 2;

			$.get("res/grass.json", function(data) {
				spritesheet.width = data.width;
				spritesheet.height = data.height;
				spritesheet.sprites = data.sprites;
				resourceLoaded();
			}, "json");

			return spritesheet;
		})()
	};

	this.background = new g13.CanvasBackground();

	this.ui = new g13.UI(this);

	this.cursor = {
		active: false,
		snapping: false,
		snapTarget: {
			object: null,
			data: null
		},
		current: null,
		absX: 0,
		absY: 0,
		mapX: 0,
		mapY: 0,
		snapX: 0,
		snapY: 0
	};

	this.tools = {
		current: null,
		"selection": new g13.tools.Selection(),
		"polygon":   new g13.tools.Polygon(),
		"grass":     new g13.tools.Grass(),
		"soldier":   new g13.tools.Soldier(),
		"pan":       new g13.tools.Pan()
	};

	for (var i in this.tools)
	{
		if (this.tools[i] !== null)
			this.tools[i].toolType = i;
	}

	this.listeners = [
		this.ui,
		this.tools["pan"]
	];

	// initialize

	this.event({type: "resize"});
	gfx.target(null);
	gfx.clear();
}

Editor.prototype.newMap = function(width, height)
{
	this.map = new g13.Map();
	this.map.resize(width, height);

	this.event({type: "newmap", map: this.map});
}

Editor.prototype.loadMap = function(name)
{
	var key = "map-" + name;

	if (key in localStorage)
	{
		this.map = g13.Map.unserialize(this, JSON.parse(localStorage[key]));
		this.map.name = name;
		this.event({type: "newmap", map: this.map});
	}
}

Editor.prototype.load = function()
{
}

Editor.prototype.autoLoad = function()
{
	if ("autosave" in localStorage)
	{
		var data = JSON.parse(localStorage["autosave"]);

		this.map = g13.Map.unserialize(this, data.map);
		this.map.name = data.name;
		this.event({type: "newmap", map: this.map});

		return true;
	}

	return false;
}

Editor.prototype.autoSave = function()
{
	// TODO: check if there are changes, etc

	var data = {
		name: this.map.name,
		map: this.map.serialize()
	};

	localStorage["autosave"] = JSON.stringify(data);
}

Editor.prototype.save = function()
{
	if (this.map.name === null)
	{
		this.saveAs();
	}
	else
	{
		localStorage["map-" + this.map.name] = JSON.stringify(this.map.serialize());
		this.ui.setTitle(this.map.name);
	}
}

Editor.prototype.saveAs = function()
{
	var editor = this;

	ui.showModal(this.ui.saveDialog, function(result) {
		if (result === "ok")
		{
			var name = $(this).find("input").val();

			if (name !== "")
			{
				editor.map.name = name;
				editor.save();
			}
		}
	});
}

Editor.prototype.export = function()
{
	var data = JSON.stringify(this.map.export());
	var url = URL.createObjectURL(new Blob([data], {type: "application/octet-stream"}));

	var a = document.createElement("a");

	a.setAttribute("href", url);
	a.setAttribute("download", this.map.name === null ? "map.json" : this.map.name + ".json");
	a.click();
}

Editor.prototype.getCanvas = function()
{
	return this.canvas;
}

Editor.prototype.getResource = function(id)
{
	return this.resources[id];
}

Editor.prototype.getSelection = function()
{
	return this.map.selection;
}

Editor.prototype.getView = function()
{
	if (this.map !== null)
		return this.map.view;

	return {x: 0, y: 0, zoom: 1};
}

Editor.prototype.setTool = function(tool)
{
	var nextTool = null;

	if (tool.constructor === String && (tool in this.tools))
		nextTool = this.tools[tool];
	else
		nextTool = tool;

	if (nextTool)
	{
		var prevTool = this.tools.current;

		this.event({type: "tooldeactivate", nextTool: nextTool});
		this.tools.current = nextTool;
		this.event({type: "toolactivate", prevTool: prevTool});
	}
	else
	{
		console.error("Tool '" + tool + "' doesn't exist.");
	}
}

Editor.prototype.setCursor = function(cursor)
{
	if (this.cursor.current !== cursor)
	{
		if (this.cursor.current !== null)
			$(this.getCanvas()).removeClass("cursor-" + this.cursor.current);

		$(this.getCanvas()).addClass("cursor-" + cursor);

		this.cursor.current = cursor;
	}
}

Editor.prototype.getCursorClass = function()
{
	if (this.cursor.current !== null)
		return "cursor-" + this.cursor.current;

	return "";
}

Editor.prototype.isCursorActive = function()
{
	return this.cursor.active;
}

Editor.prototype.setZoom = function(zoom)
{
	if (zoom !== this.map.view.zoom)
	{
		this.map.view.zoom = zoom;
		this.event({type: "zoomchange", zoom: zoom});
	}
}

Editor.prototype.getZoom = function()
{
	return this.map.view.zoom;
}

Editor.prototype.zoomIn = function()
{
	this.setZoom(this.getZoom() * 1.5);
}

Editor.prototype.zoomOut = function()
{
	this.setZoom(this.getZoom() / 1.5);
}

Editor.prototype.updateCursorPosition = function(x, y)
{
	if (this.map === null)
		return;

	if (arguments.length === 0)
	{
		x = this.cursor.absX;
		y = this.cursor.absY;
	}

	var offset = $(this.getCanvas()).offset();

	this.cursor.absX = x;
	this.cursor.absY = y;

	var vx = this.map.view.x;
	var vy = this.map.view.y;
	var vz = this.map.view.zoom;
	var cw = this.getCanvas().width;
	var ch = this.getCanvas().height;
	var cx = offset.left;
	var cy = offset.top;

	this.cursor.mapX = (x - cx - cw / 2) * (1 / vz) - vx;
	this.cursor.mapY = (y - cy - ch / 2) * (1 / vz) - vy;

	this.cursor.snapping = false;
	this.cursor.snapTarget.object = null;
	this.cursor.snapTarget.data = null;
	this.cursor.snapX = this.cursor.mapX;
	this.cursor.snapY = this.cursor.mapY;

	var radius = this.getSnapRadius();
	var x = this.cursor.snapX;
	var y = this.cursor.snapY;

	var p = {x: 0, y: 0, data:null};

	if ("snaptest" in this.tools.current && this.tools.current.snaptest(x, y, radius, p))
	{
		this.cursor.snapping = true;
		this.cursor.snapX = p.x;
		this.cursor.snapY = p.y;
	}
	else
	{
		var sel = this.getSelection();
		var dragging = this.tools.current === this.tools["selection"] && this.tools.current.dragging;
		var objects = this.map.retrieve(x - radius, y - radius, 2 * radius, 2 * radius);

		for (var i = 0; i < objects.length; i++)
		{
			if (dragging && sel.contains(objects[i]))
				continue;

			if (objects[i].snaptest(x, y, radius, p))
			{
				this.cursor.snapping = true;
				this.cursor.snapTarget.object = objects[i];
				this.cursor.snapTarget.data = p.data;
				this.cursor.snapX = p.x;
				this.cursor.snapY = p.y;

				break;
			}
		}
	}
}

Editor.prototype.isSnapping = function()
{
	return this.cursor.snapping;
}

Editor.prototype.getSnapTarget = function()
{
	return this.cursor.snapTarget;
}

Editor.prototype.getSnapRadius = function()
{
	return 10 / this.getZoom();
}

Editor.prototype.invalidate = function()
{
	if (!this.invalidated)
	{
		this.invalidated = true;
		requestAnimationFrame(this.update);
	}
}

Editor.prototype.cancel = function()
{
	this.event({type: "cancel"});
}

Editor.prototype.delete = function()
{
	var selection = this.getSelection();

	if (!selection.isEmpty())
	{
		var objects = selection.objects.slice(0);

		this.execute({
			undo: {func: "add_objects", data: {objects: objects, select: true}},
			redo: {func: "remove_objects", data: {objects: objects}}
		});

		this.event({type: "objectschange"});
	}
}

Editor.prototype.execute = function(action)
{
	g13.actions[action.redo.func](this, action.redo.data);

	this.pushHistory(action);
	this.invalidate();
}

Editor.prototype.pushHistory = function(action)
{
	var history = this.map.history;

	if (history.index < history.actions.length - 1)
		history.actions.splice(history.index + 1, history.actions.length);

	history.actions.push(action);
	history.index++;

	// TODO: set some limits

	ui.enable("undo");
	ui.disable("redo");
}

Editor.prototype.undo = function()
{
	var history = this.map.history;

	if (history.index >= 0)
	{
		var action = history.actions[history.index--].undo;
		g13.actions[action.func](this, action.data);
		this.invalidate();

		ui.enable("redo");

		if (history.index < 0)
			ui.disable("undo");

		this.event({type: "objectschange"});
	}
}

Editor.prototype.redo = function()
{
	var history = this.map.history;

	if (history.index < history.actions.length - 1)
	{
		var action = history.actions[++history.index].redo;
		g13.actions[action.func](this, action.data);
		this.invalidate();

		ui.enable("undo");

		if (history.index === history.actions.length - 1)
			ui.disable("redo");

		this.event({type: "objectschange"});
	}
}

// -----------------------------------------------------------------------------
// events
// -----------------------------------------------------------------------------

Editor.prototype.event = function(event)
{
	if (event.type in this.on)
		this.on[event.type].call(this, event);

	for (var i = 0; i < this.listeners.length; i++)
	{
		if (event.type in this.listeners[i].on)
			this.listeners[i].on[event.type].call(this.listeners[i], this, event);
	}

	if (this.tools.current !== null && event.type in this.tools.current.on)
		this.tools.current.on[event.type].call(this.tools.current, this, event);
}

Editor.prototype.on = {};

Editor.prototype.on["load"] = function(event)
{
	if (!this.autoLoad())
		this.newMap(1500, 800);

	var self = this;

	$(window).on("beforeunload", function() {
		self.autoSave();
	});

	// setInterval(function() { self.autoSave(); }, 1000 * 60 * 1);
}

Editor.prototype.on["mouseenter"] = function(event)
{
	this.cursor.active = true;
	this.updateCursorPosition(event.pageX, event.pageY);
}

Editor.prototype.on["mouseleave"] = function(event)
{
	if (!ui.hasCapture(this.getCanvas()))
		this.cursor.active = false;

	this.updateCursorPosition(event.pageX, event.pageY);
}

Editor.prototype.on["mousemove"] = function(event)
{
	this.updateCursorPosition(event.pageX, event.pageY);
}

Editor.prototype.on["mousedown"] = function(event)
{
	this.updateCursorPosition(event.pageX, event.pageY);
}

Editor.prototype.draw = function()
{
	if (this.map === null)
		return;

	var view = this.getView();

	gfx.target(this.framebuffer);

	gfx.bgcolor(0, 0, 0, 0);
	gfx.clear();
	gfx.identity();
	gfx.translate(this.getCanvas().width / 2, this.getCanvas().height / 2);
	gfx.scale(view.zoom, view.zoom);
	gfx.translate(view.x, view.y);

	this.map.draw(this);
	this.event({type: "draw"});

	gfx.target(null);
	gfx.bgcolor(0xC0, 0xC0, 0xC0, 1);
	gfx.clear();
	gfx.identity();
	gfx.bind(this.framebuffer.texture);

	this.screenQuad.a = 0.2;
	this.screenQuad.draw();

	gfx.translate(this.getCanvas().width / 2, this.getCanvas().height / 2);
	gfx.scale(view.zoom, view.zoom);
	gfx.translate(view.x, view.y);

	this.background.draw();

	var m = gfx.transform();

	var x0 = mat3.mulx(m, -this.map.width / 2, -this.map.height / 2);
	var y0 = mat3.muly(m, -this.map.width / 2, -this.map.height / 2);
	var x1 = mat3.mulx(m,  this.map.width / 2,  this.map.height / 2);
	var y1 = mat3.muly(m,  this.map.width / 2,  this.map.height / 2);

	gfx.identity();
	gfx.bind(this.framebuffer.texture);
	gfx.scissor(Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0) + 1, Math.ceil(y1 - y0) + 1);

	this.screenQuad.a = 1;
	this.screenQuad.draw();

	gfx.scissor(false);

	gfx.translate(this.getCanvas().width / 2, this.getCanvas().height / 2);
	gfx.scale(view.zoom, view.zoom);
	gfx.translate(view.x, view.y);

	this.event({type: "postdraw"});
}

Editor.prototype.on["resize"] = function()
{
	this.canvas.width = 0;
	this.canvas.height = 0;

	var w = $(this.ui.panels["view"]).width();
	var h = $(this.ui.panels["view"]).height();

	this.canvas.width = w;
	this.canvas.height = h;

	gfx.viewport(w, h);

	if (this.framebuffer === null)
		this.framebuffer = new gfx.Framebuffer(w, h, true);
	else
		this.framebuffer.resize(w, h);

	this.screenQuad.w = w;
	this.screenQuad.h = -h;
	this.screenQuad.y = h;

	this.invalidate();
}

Editor.prototype.on["newmap"] = function(event)
{
	this.setTool("selection");
	this.background.update(event.map);
	this.updateCursorPosition();
	this.invalidate();
}

Editor.prototype.on["zoomchange"] = function(event)
{
	this.background.update(this.map);
	this.updateCursorPosition();
	this.invalidate();
}

Editor.prototype.on["wheel"] = function(event)
{
	if (event.delta === 1)
		this.zoomIn();
	else if (event.delta === -1)
		this.zoomOut();
}

})();
