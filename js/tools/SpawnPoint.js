(function() {

g13["tools"] = g13["tools"] || {};
g13["tools"]["SpawnPoint"] = SpawnPoint;

function SpawnPoint()
{
	this.sprite = new gfx.Sprite();
	this.spawnpoint = new g13.SpawnPoint(0, 0);
}

SpawnPoint.prototype.on = {};

SpawnPoint.prototype.on["toolactivate"] = function(editor, event)
{
	editor.setCursor("none");
	$(editor.ui.tools["spawnpoint"]).addClass("enabled");
	editor.invalidate();
}

SpawnPoint.prototype.on["tooldeactivate"] = function(editor)
{
	$(editor.ui.tools["spawnpoint"]).removeClass("enabled");
	editor.invalidate();
}

SpawnPoint.prototype.on["mousedown"] = function(editor, event)
{
	if (event.which === 1)
	{
		var x = editor.cursor.mapX;
		var y = editor.cursor.mapY;

		var objects = [new g13.SpawnPoint(x, y)];

		editor.execute({
			undo: {func: "remove_objects", data: {objects: objects}},
			redo: {func: "add_objects", data: {objects: objects, select: false}}
		});
	}
	else if (event.which === 3)
	{
		editor.setTool("selection");
	}
}

SpawnPoint.prototype.on["mousemove"] = function(editor)
{
	if (editor.isCursorActive())
		editor.invalidate();
}

SpawnPoint.prototype.on["mouseleave"] = function(editor)
{
	editor.invalidate();
}

SpawnPoint.prototype.on["draw"] = function(editor)
{
	if (!editor.isCursorActive())
		return;

	this.spawnpoint.moveTo(editor.cursor.mapX, editor.cursor.mapY);
	this.spawnpoint.sprite(this.sprite);
	this.sprite.a = 0.8;

	gfx.bind(editor.getResource("spawnpoint"));
	this.sprite.draw();
}

})();
