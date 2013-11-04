(function() {

g13["tools"] = g13["tools"] || {};
g13["tools"]["Grass"] = Grass;

inherit(Grass, g13.tools.Linestrip);

Grass.prototype.on = object_copy(g13.tools.Linestrip.prototype.on);

function Grass()
{
	this.base.call(this);
	this.borderHook = null;
}

Grass.prototype.on["finish"] = function(editor)
{
	if (this.points.length < 2)
		return true;

	var surface = new g13.Grass(this.points, editor.getResource("grass"));
	var objects = [surface];

	editor.execute({
		undo: {func: "remove_objects", data: {objects: objects}},
		redo: {func: "add_objects", data: {objects: objects, select: false}}
	});

	this.borderHook = null;

	return true;
}

Grass.prototype.on["addpoint"] = function(editor, event)
{
	if (!this.ortho && editor.isSnapping() && editor.getSnapTarget() !== null &&
		(editor.getSnapTarget().object instanceof g13.Polygon))
	{
		if (this.borderHook === null)
		{
			this.borderHook = {
				object: editor.getSnapTarget().object,
				start: editor.getSnapTarget().data
			};
		}
		else if (editor.getSnapTarget().object === this.borderHook.object)
		{
			var poly = this.borderHook.object;
			var start = this.borderHook.start;
			var end = editor.getSnapTarget().data;
			var N = poly.points.length;
			var inc = poly.ccw ? 1 : -1;
			var p = {x: 0, y: 0};

			for (var i = start; i !== end; i = (i + inc) % N)
			{
				poly.getPoint((i + inc) % N, p);
				this.pushPoint(p.x, p.y);
			}

			this.borderHook = null;
			return false;
		}
		else
		{
			this.borderHook = null;
		}
	}
	else
	{
		this.borderHook = null;
	}

	return true;
}

Grass.prototype.on["draw"] = function(editor, event)
{
	if (this.borderHook === null || this.points === null || this.ortho || !editor.isSnapping() ||
		editor.getSnapTarget() === null || editor.getSnapTarget().object !== this.borderHook.object)
	{
		g13.tools.Linestrip.prototype.on["draw"].call(this, editor, event);
		return;
	}

	var poly = this.borderHook.object;
	var start = this.borderHook.start;
	var end = editor.getSnapTarget().data;
	var N = poly.points.length;
	var inc = poly.ccw ? 1 : -1;
	var p = {x: 0, y: 0};

	var count = 0;


	for (var i = start; i !== end; i = (i + inc + N) % N)
	{
		poly.getPoint((i + inc + N) % N, p);
		this.setBufferPoint(this.points.length + count, p.x, p.y);
		count++;
	}

	this.vbo.upload();

	gfx.bind(gfx.White);
	gfx.pixelAlign(true);
	this.vbo.mode = gfx.LineStrip;
	gfx.draw(this.vbo, this.points.length + count);
	this.vbo.mode = gfx.Points;
	gfx.draw(this.vbo, this.points.length + count);
	gfx.pixelAlign(false);
}

})();
