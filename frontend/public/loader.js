// Safety fallback: hide loader after 4 seconds no matter what
setTimeout(function() {
  var overlay = document.getElementById('loader-overlay');
  if (overlay && overlay.style.display !== 'none') {
    overlay.style.opacity = '0';
    setTimeout(function() { overlay.style.display = 'none'; }, 500);
  }
}, 4000);

try {
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var cx = 190, cy = 150;
  var t = 0;

  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  function drawHex(r, p, alpha, lw) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 30);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    var drawn = p * 6;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i <= 6; i++) {
      var idx = i % 6;
      var seg = Math.min(1, drawn - i + 1);
      if (seg <= 0) break;
      var pr = pts[i - 1], cr = pts[idx];
      ctx.lineTo(pr[0] + (cr[0] - pr[0]) * seg, pr[1] + (cr[1] - pr[1]) * seg);
    }
    ctx.strokeStyle = 'rgba(140,145,180,' + alpha + ')';
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, 380, 380);
    ctx.fillStyle = '#13131A';
    ctx.fillRect(0, 0, 380, 380);
    var f = t * 1.6;

    var rings = [14, 22, 30, 40, 52, 64, 78];
    var alphas = [0.9, 0.75, 0.62, 0.50, 0.38, 0.26, 0.16];
    var lws = [1.8, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0];

    rings.forEach(function(r, i) {
      var start = i * 18;
      if (f >= start) {
        var p = easeOut(Math.min(1, (f - start) / 50));
        drawHex(r, p, alphas[i] * p, lws[i]);
      }
    });

    // Spike lines + dots
    if (f >= 130) {
      var p = easeOut(Math.min(1, (f - 130) / 40));
      for (var i = 0; i < 6; i++) {
        var a = Math.PI / 180 * (60 * i - 30);
        var vx = Math.cos(a), vy = Math.sin(a);
        var x1 = cx + 78 * vx, y1 = cy + 78 * vy;
        var x2 = x1 + 20 * vx * p, y2 = y1 + 20 * vy * p;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(160,165,200,' + (p * 0.7) + ')';
        ctx.lineWidth = 1; ctx.stroke();
        if (p > 0.6) {
          var np = (p - 0.6) / 0.4;
          ctx.beginPath(); ctx.arc(x2, y2, 5 * np, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(160,165,200,' + (np * 0.85) + ')'; ctx.fill();
          ctx.beginPath(); ctx.arc(x2, y2, 5 * np, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(100,105,140,' + np + ')'; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(x2, y2, 2 * np, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220,225,255,' + (np * 0.9) + ')'; ctx.fill();
        }
      }
    }

    // Center orb
    if (f >= 10) {
      var p = easeOut(Math.min(1, (f - 10) / 30));
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#111120'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,165,200,' + (p * 0.5) + ')'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,225,255,' + (p * 0.85) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + p + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 1.5, cy - 1.5, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }

    // "orvicc" text typed out
    if (f >= 195) {
      var p = easeOut(Math.min(1, (f - 195) / 50));
      var word = 'orvicc';
      var chars = Math.floor(p * word.length);
      ctx.font = '600 36px Inter,Helvetica Neue,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(232,232,245,' + p + ')';
      ctx.fillText(word.slice(0, chars), cx, cy + 120);

      // Blinking cursor
      if (chars < word.length) {
        var fullWidth = ctx.measureText(word).width;
        var typedWidth = ctx.measureText(word.slice(0, chars)).width;
        var cursorX = cx - fullWidth / 2 + typedWidth + 1;
        ctx.fillStyle = 'rgba(232,232,245,' + (Math.sin(f * 0.45) > 0 ? 0.8 : 0) + ')';
        ctx.fillRect(cursorX, cy + 93, 2, 28);
      }
    }

    // "AUTOMATION" subtitle
    if (f >= 235) {
      var p = easeOut(Math.min(1, (f - 235) / 35));
      ctx.font = '600 10px Inter,Helvetica Neue,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(110,112,145,' + (p * 0.8) + ')';
      ctx.fillText('AUTOMATION', cx, cy + 145);
    }

    // Outer pulse ring
    if (f > 310) {
      var pulse = Math.sin((f - 310) * 0.055);
      ctx.beginPath(); ctx.arc(cx, cy, 82 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(120,125,160,' + (0.08 + pulse * 0.04) + ')';
      ctx.lineWidth = 1; ctx.stroke();
    }

    t++;
    if (t > 340) {
      var overlay = document.getElementById('loader-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.style.display = 'none'; }, 500);
      }
      return;
    }
    requestAnimationFrame(draw);
  }

  draw();

} catch (e) {
  console.error('Loader error:', e);
  var overlay = document.getElementById('loader-overlay');
  if (overlay) overlay.style.display = 'none';
}
