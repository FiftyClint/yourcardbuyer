/*
 * The seller form, progressively enhanced.
 *
 * Without script the form posts straight to /api/sell with the original photos.
 * With script, each photo is shrunk to at most 2000px on its long side as a
 * JPEG before upload: a phone photo drops from several megabytes to a few
 * hundred kilobytes, which matters on a weak signal and keeps the Worker well
 * inside its request limits. A photo the browser cannot decode (HEIC outside
 * Safari, for instance) is sent as it is.
 */
(function () {
  var MAX_PHOTOS = __MAX_PHOTOS__;
  var MAX_EDGE = 2000;
  var PREVIEW = __PREVIEW__;

  var form = document.getElementById('seller-form');
  if (!form) return;
  var input = document.getElementById('f-photos');
  var thumbs = document.getElementById('thumbs');
  var drop = document.getElementById('drop');
  var status = document.getElementById('f-status');
  var button = document.getElementById('f-submit');
  var loaded = document.getElementById('f-loaded');
  if (loaded) loaded.value = String(Date.now());

  var chosen = [];

  function say(text, isError) {
    status.textContent = text;
    status.classList.toggle('is-error', !!isError);
  }

  function render() {
    thumbs.innerHTML = '';
    chosen.forEach(function (file) {
      if (!/^image\//.test(file.type)) return;
      var img = document.createElement('img');
      img.alt = file.name;
      img.src = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(img.src); };
      thumbs.appendChild(img);
    });
  }

  function add(files) {
    var list = Array.prototype.slice.call(files || []);
    list.forEach(function (f) {
      if (chosen.length < MAX_PHOTOS) chosen.push(f);
    });
    if (list.length && chosen.length >= MAX_PHOTOS) say('Up to ' + MAX_PHOTOS + ' photos. Extra photos were left off.', false);
    render();
  }

  input.addEventListener('change', function () { chosen = []; add(input.files); });
  ['dragenter', 'dragover'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) { add(e.dataTransfer && e.dataTransfer.files); });

  function shrink(file) {
    if (!window.createImageBitmap || !/^image\//.test(file.type)) return Promise.resolve(file);
    return createImageBitmap(file).then(function (bmp) {
      var scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          if (!blob) return resolve(file);
          var name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      });
    }).catch(function () { return file; });
  }

  function missing() {
    var bad = [];
    if (!form.name.value.trim()) bad.push('your name');
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push('an email address');
    if (!form.kind.value) bad.push('what you are selling');
    if (!form.description.value.trim()) bad.push('a short description');
    return bad;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = missing();
    if (bad.length) { say('Please add ' + bad.join(', ') + '.', true); return; }

    if (PREVIEW) {
      say('Preview only. On the live site this would send your details and ' + chosen.length + ' photo' + (chosen.length === 1 ? '' : 's') + ' to Your Card Buyer.', false);
      return;
    }

    button.disabled = true;
    say(chosen.length ? 'Preparing photos...' : 'Sending...', false);

    Promise.all(chosen.map(shrink)).then(function (files) {
      var data = new FormData(form);
      data.delete('photos');
      files.forEach(function (f) { data.append('photos', f, f.name); });
      data.set('client', 'script');
      say('Sending...', false);
      return fetch(form.action, { method: 'POST', body: data, headers: { accept: 'application/json' } });
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error(body.error || 'Request failed');
        var next = '/thank-you/' + (body.photos === 'missing' ? '?photos=missing' : '');
        window.location.assign(next);
      });
    }).catch(function () {
      button.disabled = false;
      say('That did not go through. Check your connection and try again.', true);
    });
  });
})();
