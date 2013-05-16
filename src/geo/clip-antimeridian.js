import "../core/true";
import "../math/trigonometry";
import "clip";
import "point-in-polygon";

var d3_geo_clipAntimeridian = d3_geo_clip(
    d3_geo_clipAntimeridianVisible,
    d3_geo_clipAntimeridianLine,
    d3_geo_clipAntimeridianInterpolate,
    [-π, -π / 2],
    d3_geo_clipAntimeridianSort);

// Takes a line and cuts into visible segments. Return values:
//   0: there were intersections or the line was empty.
//   1: no intersections.
//   2: there were intersections, and the first and last segments should be
//      rejoined.
function d3_geo_clipAntimeridianLine(listener) {
  var λ0 = NaN,
      φ0 = NaN,
      sλ0 = NaN,
      clean; // no intersections

  return {
    lineStart: function() {
      listener.lineStart();
      clean = 1;
    },
    point: function(λ1, φ1) {
      var sλ1 = λ1 > 0 ? π - ε : -π,
          dλ = Math.abs(λ1 - λ0);
      if (Math.abs(dλ - π) < ε) { // line crosses a pole
        listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
        listener.point(sλ0, φ0);
        listener.lineEnd();
        listener.lineStart();
        listener.point(sλ1, φ0);
        listener.point( λ1, φ0);
        clean = 0;
      } else if (sλ0 !== sλ1 && dλ >= π) { // line crosses antimeridian
        // handle degeneracies
        if (Math.abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
        if (Math.abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
        φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
        listener.point(sλ0, φ0);
        listener.lineEnd();
        listener.lineStart();
        listener.point(sλ1, φ0);
        clean = 0;
      }
      listener.point(λ0 = λ1, φ0 = φ1);
      sλ0 = sλ1;
    },
    lineEnd: function() {
      listener.lineEnd();
      λ0 = φ0 = NaN;
    },
    // if there are intersections, we always rejoin the first and last segments.
    clean: function() { return 2 - clean; }
  };
}

function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
  var cosφ0,
      cosφ1,
      sinλ0_λ1 = Math.sin(λ0 - λ1);
  return Math.abs(sinλ0_λ1) > ε
      ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1)
                 - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0))
                 / (cosφ0 * cosφ1 * sinλ0_λ1))
      : (φ0 + φ1) / 2;
}

function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
  var φ;
  if (from == null) {
    φ = direction * halfπ;
    listener.point(-π,  φ);
    listener.point( 0,  φ);
    listener.point( π - ε,  φ);
    listener.point( π - ε,  0);
    listener.point( π - ε, -φ);
    listener.point( 0, -φ);
    listener.point(-π, -φ);
    listener.point(-π,  0);
    listener.point(-π,  φ);
  } else if (Math.abs(from[0] - to[0]) > ε) {
    var s0 = -π,
        s1 = π - ε,
        s = (from[0] < to[0] ? 1 : -1) * π;
    if (to[0] < from[0]) s0 = π - ε, s1 = -π;
    φ = direction * s / 2;
    listener.point(s0, φ);
    listener.point( 0, φ);
    listener.point(s1, φ);
  } else {
    listener.point(to[0], to[1]);
  }
}

function d3_geo_clipAntimeridianSort(a, b) {
  return ((a = a.point)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1])
       - ((b = b.point)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
}

function d3_geo_clipAntimeridianVisible(λ) {
  return Math.abs(Math.abs(λ) - π) > ε;
}
