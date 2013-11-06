(function() {

g13["Map"] = Map;

var cache = {
	sprite: new gfx.Sprite()
};

function Map()
{
	this.name = null;
	this.width = 0;
	this.height = 0;
	this.soldiers = [];
	this.polygons = [];
	this.grass = [];
	this.selection = new g13.Selection();
	this.view = {x: 0, y: 0, zoom: 1};
	this.history = { index: -1, actions: [] };
	this.modified = false;

	this.spriteBatch = new gfx.SpriteBatch(5, gfx.Dynamic);
}

Map.prototype.resize = function(width, height)
{
	this.width = width;
	this.height = height;
}

Map.prototype.retrieve = function(x, y, w, h)
{
	var objects = [];
	var collections = [this.soldiers, this.grass, this.polygons];

	if (arguments.length === 2)
	{
		for (var i = 0; i < collections.length; i++)
		{
			for (var j = 0; j < collections[i].length; j++)
			{
				if (collections[i][j].hittest(x, y))
					objects.push(collections[i][j]);
			}
		}
	}
	else
	{
		for (var i = 0; i < collections.length; i++)
		{
			for (var j = 0; j < collections[i].length; j++)
			{
				if (collections[i][j].intersects(x, y, w, h))
					objects.push(collections[i][j]);
			}
		}
	}

	return objects;
}

Map.prototype.add = function(object)
{
	switch (object.constructor)
	{
		case g13.Soldier: this.soldiers.push(object); break;
		case g13.Polygon: this.polygons.push(object); break;
		case g13.Grass:   this.grass.push(object);    break;
	}
}

Map.prototype.remove = function(object)
{
	switch (object.constructor)
	{
		case g13.Soldier: array_remove(this.soldiers, object); break;
		case g13.Polygon: array_remove(this.polygons, object); break;
		case g13.Grass:   array_remove(this.grass, object);    break;
	}
}

Map.prototype.draw = function(editor)
{
	for (var i = 0; i < this.polygons.length; i++)
		this.polygons[i].draw(editor);

	for (var i = 0; i < this.grass.length; i++)
		this.grass[i].draw(editor);

	var spriteBatch = this.spriteBatch;

	if (this.soldiers.length > 0)
	{
		if (spriteBatch.maxSize < this.soldiers.length)
			spriteBatch.resize(this.soldiers.length);

		spriteBatch.clear();

		for (var i = 0; i < this.soldiers.length; i++)
			spriteBatch.add(this.soldiers[i].sprite(cache.sprite));

		spriteBatch.upload();
		spriteBatch.texture = editor.getResource("soldier");
		spriteBatch.draw();
	}
}

Map.prototype.export = function()
{
	var data = {
		width: this.width,
		height: this.height,
		ground: {vbo: [], ibo: []},
		grass: [],
		collision: []
	};

	var base = 0;

	for (var i = 0; i < this.polygons.length; i++)
	{
		var polyData = this.polygons[i].export();

		for (var j = 0; j < polyData.ibo.length; j++)
			polyData.ibo[j] += base;

		data.ground.vbo = data.ground.vbo.concat(polyData.vbo);
		data.ground.ibo = data.ground.ibo.concat(polyData.ibo);

		base += polyData.vbo.length;
	}

	for (var i = 0; i < this.grass.length; i++)
	{
		for (var j = 0; j < this.grass[i].sprites.length; j++)
		{
			var sprite = object_copy(this.grass[i].sprites[j]);

			sprite.x += this.grass[i].x;
			sprite.y += this.grass[i].y;

			data.grass.push(sprite);
		}
	}

	for (var i = 0; i < this.polygons.length; i++)
	{
		var points = this.polygons[i].points.slice(0);

		if (this.polygons[i].ccw)
			points.reverse();

		for (var j = 0; j < points.length; j++)
		{
			points[j] = {
				x: Math.floor((points[j].x + this.polygons[i].x) * 65536),
				y: Math.floor((points[j].y + this.polygons[i].y) * 65536)
			};
		}

		points.push({x: points[0].x, y: points[0].y});

		data.collision.push(points);
	}

	return data;
}

Map.prototype.serialize = function()
{
	var data = {};

	data.width = this.width;
	data.height = this.height;
	data.view = {x: this.view.x, y: this.view.y, zoom: this.view.zoom};
	data.polygons = [];
	data.grass = [];
	data.soldiers = [];

	for (var i = 0; i < this.polygons.length; i++)
		data.polygons.push(this.polygons[i].serialize());

	for (var i = 0; i < this.grass.length; i++)
		data.grass.push(this.grass[i].serialize());

	for (var i = 0; i < this.soldiers.length; i++)
		data.soldiers.push(this.soldiers[i].serialize());

	return data;
}

Map.unserialize = function(editor, data)
{
	var map = new g13.Map();

	map.resize(data.width, data.height);

	if (data.view)
	{
		map.view.x    = data.view.x;
		map.view.y    = data.view.y;
		map.view.zoom = data.view.zoom;
	}

	for (var i = 0; i < data.polygons.length; i++)
		map.add(g13.Polygon.unserialize(data.polygons[i]));

	for (var i = 0; i < data.grass.length; i++)
		map.add(g13.Grass.unserialize(data.grass[i], editor.getResource("grass")));

	for (var i = 0; i < data.soldiers.length; i++)
		map.add(g13.Soldier.unserialize(data.soldiers[i]));

	return map;
}

})();
