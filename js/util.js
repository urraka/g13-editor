function inherit(sub, base)
{
	function tmp() {}
	tmp.prototype = base.prototype;
	sub.prototype = new tmp();
	sub.prototype.constructor = sub;
	sub.prototype.base = base;
}

function array_remove(array, item)
{
	var index = array.indexOf(item);

	if (index !== -1)
		array.splice(index, 1);
}

function object_copy(object)
{
	var result = {};

	for (var i in object)
	{
		if (object.hasOwnProperty(i))
			result[i] = object[i];
	}

	return result;
}

function rand(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function lerp(a, b, amount)
{
	return a + (b - a) * amount;
}

function sqr(x)
{
	return x * x;
}

function distance(ax, ay, bx, by)
{
	return Math.sqrt(distance2(ax, ay, bx, by));
}

function distance2(ax, ay, bx, by)
{
	return sqr(bx - ax) + sqr(by - ay);
}

function distance_to_segment2(x, y, ax, ay, bx, by)
{
	var l2 = distance2(ax, ay, bx, by);

	if (l2 === 0)
		return distance2(x, y, ax, ay);

	var t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / l2;

	if (t < 0) return distance2(x, y, ax, ay);
	if (t > 1) return distance2(x, y, bx, by);

	return distance2(x, y, ax + t * (bx - ax), ay + t * (by - ay));
}

function distance_to_segment(x, y, ax, ay, bx, by)
{
	return Math.sqrt(distance_to_segment2(x, y, ax, ay, bx, by));
}

function rect_expand(a, b)
{
	var R = a.x + a.w;
	var B = a.y + a.h;

	a.x = Math.min(a.x, b.x);
	a.y = Math.min(a.y, b.y);
	a.w = Math.max(R, b.x + b.w) - a.x;
	a.h = Math.max(B, b.y + b.h) - a.y;
}

function rect_assign(a, b)
{
	a.x = b.x;
	a.y = b.y;
	a.w = b.w;
	a.h = b.h;
}

function rect_contained(ax, ay, aw, ah, bx, by, bw, bh)
{
	return ax > bx && ax + aw < bx + bw && ay > by && ay + ah < by + bh;
}

function rects_intersect(ax, ay, aw, ah, bx, by, bw, bh)
{
	return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

(function /*segments_intersect*/() {
    function ccw(ax, ay, bx, by, cx, cy)
    {
        return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
    }

    function segments_intersect(ax, ay, bx, by, cx, cy, dx, dy)
    {
        return ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
            ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy);
    }

    window.segments_intersect = segments_intersect;
})();

function rect_contains(x, y, w, h, px, py)
{
	return px > x && px < x + w && py > y && py < y + h;
}

function rect_intersects_segment(x, y, w, h, ax, ay, bx, by)
{
    var minX = ax;
    var maxX = bx;

    if (ax > bx)
    {
        minX = bx;
        maxX = ax;
    }

    if (maxX > x + w) maxX = x + w;
    if (minX < x)     minX = x;
    if (minX > maxX)  return false;

    var minY = ay;
    var maxY = by;

    var dx = bx - ax;

    if (Math.abs(dx) > 0.00001)
    {
        var a = (by - ay) / dx;
        var b = ay - a * ax;
        minY = a * minX + b;
        maxY = a * maxX + b;
    }

    if (minY > maxY)
    {
        var tmp = maxY;
        maxY = minY;
        minY = tmp;
    }

    if (maxY > y + h) maxY = y + h;
    if (minY < y)     minY = y;
    if (minY > maxY)  return false;

    return true;
}

function rect_intersects_triangle(x, y, w, h, ax, ay, bx, by, cx, cy)
{
	return (
		triangle_contains(ax, ay, bx, by, cx, cy,     x,     y)        ||
		triangle_contains(ax, ay, bx, by, cx, cy, x + w,     y)        ||
		triangle_contains(ax, ay, bx, by, cx, cy, x + w, y + h)        ||
		triangle_contains(ax, ay, bx, by, cx, cy,     x, y + h)        ||
		rect_contains(x, y, w, h, ax, ay)                              ||
		rect_contains(x, y, w, h, bx, by)                              ||
		rect_contains(x, y, w, h, cx, cy)                              ||
		segments_intersect(    x,     y, x + w,     y, ax, ay, bx, by) ||
		segments_intersect(    x,     y, x + w,     y, bx, by, cx, cy) ||
		segments_intersect(    x,     y, x + w,     y, cx, cy, ax, ay) ||
		segments_intersect(x + w,     y, x + w, y + h, ax, ay, bx, by) ||
		segments_intersect(x + w,     y, x + w, y + h, bx, by, cx, cy) ||
		segments_intersect(x + w,     y, x + w, y + h, cx, cy, ax, ay) ||
		segments_intersect(x + w, y + h,     x, y + h, ax, ay, bx, by) ||
		segments_intersect(x + w, y + h,     x, y + h, bx, by, cx, cy) ||
		segments_intersect(x + w, y + h,     x, y + h, cx, cy, ax, ay) ||
		segments_intersect(    x, y + h,     x,     y, ax, ay, bx, by) ||
		segments_intersect(    x, y + h,     x,     y, bx, by, cx, cy) ||
		segments_intersect(    x, y + h,     x,     y, cx, cy, ax, ay)
	);
}

function triangle_contains(ax, ay, bx, by, cx, cy, x, y)
{
	var A = 0.5 * (-by * cx + ay * (-bx + cx) + ax * (by - cy) + bx * cy);
	var sign = A < 0 ? -1 : 1;

	var s = (ay * cx - ax * cy + (cy - ay) * x + (ax - cx) * y) * sign;
	var t = (ax * by - ay * bx + (ay - by) * x + (bx - ax) * y) * sign;

	return s >= 0 && t >= 0 && (s + t) <= (2 * A * sign);
}

function is_triangle_ccw(ax, ay, bx, by, cx, cy)
{
	return (bx - ax) * (cy - by) - (cx - bx) * (by - ay) > 0;
}

function is_polygon_ccw(points)
{
	var N = points.length;
	var k = 0;

	for (var i = 1; i < N; i++)
	{
		var p = points[i];
		var lm = points[k];

		if (p.x < lm.x || (p.x === lm.x && p.y < lm.y))
			k = i;
	}

	var a = (k - 1 + N) % N;
	var b = k;
	var c = (k + 1) % N;

	var p = points;

	return is_triangle_ccw(p[a].x, p[a].y, p[b].x, p[b].y, p[c].x, p[c].y);
}

function luminance(r, g, b)
{
	r /= 255;
	g /= 255;
	b /= 255;

	r = r <= 0.3928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
	g = g <= 0.3928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
	b = b <= 0.3928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

	return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
