(function() {

g13["tools"] = g13["tools"] || {};
g13["tools"]["Grass"] = Grass;

inherit(Grass, g13.tools.Linestrip);

Grass.prototype.on = object_copy(g13.tools.Linestrip.prototype.on);

function Grass()
{
	this.base.call(this);
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

	return true;
}

Grass.prototype.on["addpoint"] = function(editor, event)
{
	return true;
}

})();
