(function() {

g13["SpawnPoint"] = SpawnPoint;

inherit(SpawnPoint, g13.Object);

var SCALE = 0.075;

function SpawnPoint(x, y)
{
	this.base.call(this);
	this.updateLocalBounds();
	this.updateBounds();
	this.move(x, y);
}

SpawnPoint.unserialize = function(data)
{
	return new g13.SpawnPoint(data.x, data.y);
}

SpawnPoint.prototype.serialize = function()
{
	return {x: this.x, y: this.y};
}

SpawnPoint.prototype.updateLocalBounds = function()
{
	var cx = 50 * SCALE;
	var cy = 488 * SCALE;
	var size = 512 * SCALE;

	this.localBounds.x = -cx;
	this.localBounds.y = -cy;
	this.localBounds.w = size;
	this.localBounds.h = size;
}

SpawnPoint.prototype.sprite = function(sprite)
{
	sprite = sprite || new gfx.Sprite();

	sprite.x = this.x;
	sprite.y = this.y;
	sprite.w = 512;
	sprite.h = 512;
	sprite.cx = 50;
	sprite.cy = 488;
	sprite.sx = SCALE;
	sprite.sy = SCALE;
	sprite.rotation = 0;
	sprite.kx = sprite.ky = 0;
	sprite.u0 = sprite.v0 = 0;
	sprite.u1 = sprite.v1 = 1;
	sprite.r = sprite.g = sprite.b = 255;
	sprite.a = 1;

	return sprite;
}

SpawnPoint.prototype.contained = function(x, y, w, h)
{
	var a = this.bounds;

	return rect_contained(a.x, a.y, a.w, a.h, x, y, w, h);
}

SpawnPoint.prototype.intersects = function(x, y, w, h)
{
	var a = this.bounds;

	return rects_intersect(a.x, a.y, a.w, a.h, x, y, w, h);
}

SpawnPoint.prototype.hittest = function(x, y)
{
	var a = this.bounds;

	return rect_contains(a.x, a.y, a.w, a.h, x, y);
}

})();
