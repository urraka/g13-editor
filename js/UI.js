(function() {

g13["UI"] = UI;

function UI(editor)
{
	var panels = {
		"top":    $("#panel-top")[0],
		"left":   $("#panel-left")[0],
		"bottom": $("#panel-bottom")[0],
		"view":   $("#panel-view")[0]
	};

	var ico = {
		"new":     "icon-file",
		"open":    "icon-folder-open-alt",
		"save":    "icon-save",
		"export":  "icon-exportfile",
		"copy":    "icon-copy",
		"cut":     "icon-cut",
		"paste":   "icon-paste",
		"undo":    "icon-undo",
		"redo":    "icon-repeat",
		"select":  "icon-pointer",
		"soldier": "icon-male",
		"zoomin":  "icon-zoom-in",
		"zoomout": "icon-zoom-out",
		"polygon": "icon-polygon",
		"grass":   "icon-grass"
	};

	ui.command("new"          , function() { editor.newMap(3000*2, 1600*2); });
	ui.command("open"         , function() {                                });
	ui.command("save"         , function() { editor.save();                 });
	ui.command("save_as"      , function() { editor.saveAs();               });
	ui.command("export_editor", function() { editor.export(true);           });
	ui.command("export_game"  , function() { editor.export(false);          });
	ui.command("copy"         , function() {                                });
	ui.command("cut"          , function() {                                });
	ui.command("paste"        , function() {                                });
	ui.command("zoomin"       , function() { editor.zoomIn();               });
	ui.command("zoomout"      , function() { editor.zoomOut();              });
	ui.command("resetzoom"    , function() { editor.setZoom(1);             });
	ui.command("select"       , function() { editor.setTool("selection");   });
	ui.command("polygon"      , function() { editor.setTool("polygon");     });
	ui.command("grass"        , function() { editor.setTool("grass");       });
	ui.command("soldier"      , function() { editor.setTool("soldier");     });
	ui.command("cancel"       , function() { editor.cancel();               });
	ui.command("undo"         , function() { editor.undo();                 });
	ui.command("redo"         , function() { editor.redo();                 });
	ui.command("delete"       , function() { editor.delete();               });

	ui.bind("ctrl+n"       , "new");
	ui.bind("ctrl+o"       , "open");
	ui.bind("ctrl+shift+s" , "save_as");
	ui.bind("ctrl+s"       , "save");
	ui.bind("ctrl+c"       , "copy");
	ui.bind("ctrl+x"       , "cut");
	ui.bind("ctrl+v"       , "paste");
	ui.bind("+"            , "zoomin");
	ui.bind("-"            , "zoomout");
	ui.bind("ctrl+numpad0" , "resetzoom");
	ui.bind("q"            , "select");
	ui.bind("p"            , "polygon");
	ui.bind("s"            , "soldier");
	ui.bind("g"            , "grass");
	ui.bind("escape"       , "cancel");
	ui.bind("ctrl+z"       , "undo");
	ui.bind("ctrl+shift+z" , "redo");
	ui.bind("ctrl+y"       , "redo");
	ui.bind("delete"       , "delete");

	var btn = ui.IconButton;

	$(panels["top"]).append(
		ui.TitleBar("Untitled"),
		ui.MenuBar([
			ui.MenuItem({
				caption: "File",
				submenu: ui.Menu([
					ui.MenuItem({caption: "New...",     command: "new"}),
					ui.MenuItem({caption: "Open...",    command: "open"}),
					ui.MenuItem({caption: "Save",       command: "save"}),
					ui.MenuItem({caption: "Save As...", command: "save_as"}),
					ui.Separator(),
					ui.MenuItem({
						caption: "Export",
						submenu: ui.Menu([
							ui.MenuItem({caption: "Game format...", command: "export_game"}),
							ui.MenuItem({caption: "Map format...", command: "export_editor"})
						])
					})
				])
			}),
			ui.MenuItem({
				caption: "Edit",
				submenu: ui.Menu([
					ui.MenuItem({caption: "Undo",  command: "undo"}),
					ui.MenuItem({caption: "Redo",  command: "redo"}),
					ui.Separator(),
					ui.MenuItem({caption: "Copy",  command: "copy"}),
					ui.MenuItem({caption: "Cut",   command: "cut"}),
					ui.MenuItem({caption: "Paste", command: "paste"})
				])
			})
		]),
		ui.Separator(),
		ui.Toolbar({
			layout: "horizontal",
			items: [
				btn({icon: ico["new"],     tooltip: "New...",    command: "new"}),
				btn({icon: ico["open"],    tooltip: "Open...",   command: "open"}),
				btn({icon: ico["save"],    tooltip: "Save",      command: "save"}),
				ui.Separator(),
				btn({icon: ico["copy"],    tooltip: "Copy",      command: "copy"}),
				btn({icon: ico["cut"],     tooltip: "Cut",       command: "cut"}),
				btn({icon: ico["paste"],   tooltip: "Paste",     command: "paste"}),
				ui.Separator(),
				btn({icon: ico["undo"],    tooltip: "Undo",      command: "undo"}),
				btn({icon: ico["redo"],    tooltip: "Redo",      command: "redo"}),
				ui.Separator(),
				btn({icon: ico["zoomin"],  tooltip: "Zoom In",   command: "zoomin"}),
				btn({icon: ico["zoomout"], tooltip: "Zoom Out",  command: "zoomout"})
			]
		}),
		ui.Separator()
	);

	$(panels["left"]).append(
		ui.Toolbar({
			layout: "vertical",
			items: [
				btn({id: "tb-select",  icon: ico["select"],  tooltip: "Select",  command: "select"}),
				btn({id: "tb-polygon", icon: ico["polygon"], tooltip: "Polygon", command: "polygon"}),
				btn({id: "tb-grass",   icon: ico["grass"],   tooltip: "Grass",   command: "grass"}),
				btn({id: "tb-soldier", icon: ico["soldier"], tooltip: "Soldier", command: "soldier"})
			]
		}),
		ui.Separator(true)
	);

	$(panels["bottom"]).append(
		ui.Separator(),
		ui.StatusBar("<label>This text shall be replaced with something more useful.</label>")
	);

	$(panels["view"]).append(editor.getCanvas());

	ui.disable("save");
	ui.disable("save_as");
	ui.disable("copy");
	ui.disable("cut");
	ui.disable("paste");
	ui.disable("undo");
	ui.disable("redo");
	ui.disable("select");
	ui.disable("polygon");
	ui.disable("grass");
	ui.disable("soldier");
	ui.disable("zoomin");
	ui.disable("zoomout");

	this.panels = panels;

	this.tools = {
		"select":  $("#tb-select")[0],
		"polygon": $("#tb-polygon")[0],
		"grass":   $("#tb-grass")[0],
		"soldier": $("#tb-soldier")[0]
	};

	// events

	$(document).on("contextmenu", function(event)
	{
		if (event.target.nodeName !== "INPUT")
			return false;
	});

	$(document).on("keydown", function(e)
	{
		var prevent = e.ctrlKey && (
			e.which === Key["+"] ||
			e.which === Key["-"] ||
			e.which === Key["s"] ||
			e.which === Key["n"] ||
			e.which === Key["numpad0"]
		);

		if (prevent)
			return false;
	});

	function fwd(event)
	{
		editor.event(event);
	}

	$(window).on("resize", fwd);
	$(document).on("keydown keyup", fwd);
	$(editor.getCanvas()).on("mousemove mousedown mouseup mouseenter mouseleave", fwd);

	$(editor.getCanvas()).on('DOMMouseScroll mousewheel', function (e)
	{
		if (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
			fwd(new $.Event("wheel", {delta: -1}));
		else
			fwd(new $.Event("wheel", {delta: 1}));
	});

	// save/open dialog

	this.saveDialog = ui.Dialog("Save as...", [
		$('<div><input type="text" class="setfocus" /></div>')[0],
		ui.Button("Save", "ok"),
		ui.Button("Cancel", "cancel")
	]);

	$(this.saveDialog).addClass("file-dialog");
}

UI.prototype.setTitle = function(text)
{
	$(this.panels["top"]).find(".ui-title-bar label").text(text);
}

UI.prototype.on = {};

UI.prototype.on["newmap"] = function(editor, event)
{
	ui.enable("save");
	ui.enable("save_as");
	ui.enable("select");
	ui.enable("polygon");
	ui.enable("grass");
	ui.enable("soldier");
	ui.enable("zoomin");
	ui.enable("zoomout");

	this.setTitle(event.map.name === null ? "Untitled" : event.map.name);
}

})();
