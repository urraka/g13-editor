(function() {

g13["Object"] = Object;

function warn(obj, method)
{
	console.warn(obj.constructor.name + "." + method + "() not implemented.");
}

function Object()
{
	this.bounds = {x: 0, y: 0, w: 0, h: 0};
	this.localBounds = {x: 0, y: 0, w: 0, h: 0};

	// TODO: some flags that tell what transforms are available for this object

	this.x   = 0;
	this.y   = 0;
	this.rot = 0;
	this.sx  = 1;
	this.sy  = 1;
	this.kx  = 0;
	this.ky  = 0;
	this.cx  = 0;
	this.cy  = 0;
}

Object.prototype.hittest    = function(x, y)       { warn(this, "hittest"); }
Object.prototype.intersects = function(x, y, w, h) { warn(this, "intersects"); }
Object.prototype.contained  = function(x, y, w, h) { warn(this, "contained"); }

Object.prototype.unserialize = function(data)
{
	this.x   = data.x;
	this.y   = data.y;
	this.rot = data.rot;
	this.sx  = data.sx;
	this.sy  = data.sy;
	this.kx  = data.kx;
	this.ky  = data.ky;
	this.cx  = data.cx;
	this.cy  = data.cy;
}

Object.prototype.serialize = function()
{
	var data = {};

	data.x   = this.x;
	data.y   = this.y;
	data.rot = this.rot;
	data.sx  = this.sx;
	data.sy  = this.sy;
	data.kx  = this.kx;
	data.ky  = this.ky;
	data.cx  = this.cx;
	data.cy  = this.cy;

	return data;
}

Object.prototype.snaptest = function(x, y, r, p)
{
	return false;
}

Object.prototype.moveTo = function(x, y)
{
	this.x = x;
	this.y = y;

	this.updateBounds();
}

Object.prototype.move = function(dx, dy)
{
	this.moveTo(this.x + dx, this.y + dy);
}

Object.prototype.updateBounds = function()
{
	rect_assign(this.bounds, this.localBounds);

	this.bounds.x += this.x;
	this.bounds.y += this.y;
}

})();
