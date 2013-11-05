(function() {

g13["Polygon"] = Polygon;

inherit(Polygon, g13.Object);

var cache = {
	matrix1: mat3.create(),
	matrix2: mat3.create()
};

function Polygon(points)
{
	this.base.call(this);
	this.points = points.slice(0);

	// move points so origin is at center of local bounds, just because

	this.updateLocalBounds();

	var cx = this.localBounds.x + this.localBounds.w / 2;
	var cy = this.localBounds.y + this.localBounds.h / 2;

	for (var i = 0; i < this.points.length; i++)
	{
		this.points[i].x -= cx;
		this.points[i].y -= cy;
	}

	this.x += cx;
	this.y += cy;

	this.updateLocalBounds();
	this.updateBounds();

	this.ccw = is_polygon_ccw(this.points);

	// triangulate

	points = this.points;

	var contour = [];

	for (var i = 0; i < points.length; i++)
		contour.push(new poly2tri.Point(points[i].x, points[i].y));

	var sweepContext = new poly2tri.SweepContext(contour);
	sweepContext.triangulate();

	this.triangulation = sweepContext;

	var triangles = sweepContext.getTriangles() || [];
	this.triangles = triangles;

	// create vbo

	this.vbo = new gfx.VBO(points.length, gfx.Static);
	this.ibo = new gfx.IBO(triangles.length * 3, gfx.Static);

	for (var i = 0; i < sweepContext.pointCount(); i++)
	{
		var p = sweepContext.getPoint(i);

		p.index = i;
		this.vbo.set(i, p.x, p.y, p.x / 512, p.y / 512, 255, 255, 255, 1);
	}

	for (var i = 0, j = 0; i < triangles.length; i++)
	{
		this.ibo.set(j++, triangles[i].getPoint(0).index);
		this.ibo.set(j++, triangles[i].getPoint(1).index);
		this.ibo.set(j++, triangles[i].getPoint(2).index);
	}

	this.vbo.upload();
	this.ibo.upload();
	this.vbo.mode = gfx.Triangles;

}

Polygon.unserialize = function(data)
{
	var polygon = new g13.Polygon(data.points);
	g13.Object.prototype.unserialize.call(polygon, data);

	polygon.updateLocalBounds();
	polygon.updateBounds();

	return polygon;
}

Polygon.prototype.serialize = function()
{
	var data = this.base.prototype.serialize.call(this);

	data.points = this.points.slice(0);

	for (var i = 0; i < this.points.length; i++)
		data.points[i] = {x: this.points[i].x, y: this.points[i].y};

	return data;
}

Polygon.prototype.export = function()
{
	var data = {};

	data.vbo = [];
	data.ibo = [];

	for (var i = 0; i < this.triangulation.pointCount(); i++)
	{
		var p = this.triangulation.getPoint(i);

		data.vbo.push({
			x: p.x + this.x,
			y: p.y + this.y,
			u: 2 * (p.x + this.x) / 512,
			v: 2 * (p.y + this.y) / 512
		});
	}

	for (var i = 0; i < this.triangles.length; i++)
	{
		data.ibo.push(this.triangles[i].getPoint(0).index);
		data.ibo.push(this.triangles[i].getPoint(1).index);
		data.ibo.push(this.triangles[i].getPoint(2).index);
	}

	return data;
}

Polygon.prototype.updateLocalBounds = function()
{
	this.localBounds.x = 0;
	this.localBounds.y = 0;
	this.localBounds.w = 0;
	this.localBounds.h = 0;

	var points = this.points;

	if (points.length > 0)
	{
		this.localBounds.x = points[0].x;
		this.localBounds.y = points[0].y;

		var b = {x: 0, y: 0, w: 0, h: 0};

		for (var i = 1; i < points.length; i++)
		{
			b.x = points[i].x;
			b.y = points[i].y;

			rect_expand(this.localBounds, b);
		}
	}
}

Polygon.prototype.getPoint = function(index, point)
{
	point.x = this.points[index].x + this.x;
	point.y = this.points[index].y + this.y;

	return point;
}

Polygon.prototype.snaptest = function(x, y, r, p)
{
	var bx = this.bounds.x - r;
	var by = this.bounds.y - r;
	var bw = this.bounds.w + r * 2;
	var bh = this.bounds.h + r * 2;

	if (!rect_contains(bx, by, bw, bh, x, y))
		return false;

	var points = this.points;
	var N = points.length;

	r *= r;

	for (var i = 0; i < N; i++)
	{
		var px = points[i].x + this.x;
		var py = points[i].y + this.y;

		if (distance2(x, y, px, py) < r)
		{
			p.x = px;
			p.y = py;
			p.data = i;

			return true;
		}
	}

	return false;
}

Polygon.prototype.hittest = function(x, y)
{
	var p = this.points;
	var N = p.length;
	var c = false;

	for (var i = 0, j = N - 1; i < N; j = i++)
	{
		var x0 = p[j].x + this.x;
		var y0 = p[j].y + this.y;
		var x1 = p[i].x + this.x;
		var y1 = p[i].y + this.y;

		if ((y1 >= y) != (y0 >= y) && (x <= (x0 - x1) * (y - y1) / (y0 - y1) + x1))
			c = !c;
	}

	return c;
}

Polygon.prototype.intersects = function(x, y, w, h)
{
	var a = this.bounds;

	if (!rects_intersect(a.x, a.y, a.w, a.h, x, y, w, h))
		return false;

	var triangles = this.triangles;
	var N = triangles.length;

	var dx = this.x;
	var dy = this.y;

	for (var i = 0; i < N; i++)
	{
		var ax = triangles[i].getPoint(0).x + dx;
		var ay = triangles[i].getPoint(0).y + dy;
		var bx = triangles[i].getPoint(1).x + dx;
		var by = triangles[i].getPoint(1).y + dy;
		var cx = triangles[i].getPoint(2).x + dx;
		var cy = triangles[i].getPoint(2).y + dy;

		if (rect_intersects_triangle(x, y, w, h, ax, ay, bx, by, cx, cy))
			return true;
	}

	return false;
}

Polygon.prototype.contained = function(x, y, w, h)
{
	var a = this.bounds;

	return rect_contained(a.x, a.y, a.w, a.h, x, y, w, h);
}

Polygon.prototype.draw = function(editor)
{
	var mv = mat3.copy(gfx.transform(gfx.View), cache.matrix1);
	var mt = mat3.copy(gfx.transform(gfx.Texture), cache.matrix2);

	gfx.translate(gfx.View, this.x, this.y);
	gfx.scale(gfx.Texture, 2, 2);
	gfx.translate(gfx.Texture, this.x / 512, this.y / 512);

	gfx.bind(editor.getResource("rock"));
	gfx.draw(this.vbo, this.ibo);

	gfx.transform(gfx.Texture, mt);

	// this.vbo.mode = gfx.Points;
	// gfx.pixelAlign(true);
	// gfx.bind(gfx.White);
	// gfx.blend(gfx.Zero, gfx.Zero, gfx.One, gfx.One);
	// gfx.draw(this.vbo);
	// gfx.blend(gfx.Default);
	// gfx.pixelAlign(false);
	// this.vbo.mode = gfx.Triangles;

	gfx.transform(gfx.View, mv);
}

})();
