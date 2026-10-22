/* ==========================================================
   form.js
   Contact form validation (no backend, so success is simulated).
   Each rule returns true if valid, otherwise the error message.
   ========================================================== */
$(function(){
  const rules = {
    name:  v => v.trim().length > 1 || 'Please enter your full name.',
    email: v => /^\S+@\S+\.\S+$/.test(v) || 'Please enter a valid email address.',
    phone: v => /^[+\d][\d\s-]{6,}$/.test(v.trim()) || 'Please enter a valid phone number.',
    area:  v => !!v || 'Please choose a practice area.',
    msg:   v => v.trim().length >= 10 || 'Please write at least 10 characters.'
  };
  $(document).on('submit', '#cf', function(e){   // delegated: works even after the page content is swapped
    e.preventDefault();
    let ok = true;
    $.each(rules, (id, check) => {
      const r = check($('#'+id).val());
      $('#'+id).siblings('.err').text(r === true ? '' : r);       // show message under the field
      $('#'+id).attr('aria-invalid', r !== true);
      if(r !== true) ok = false;
    });
    const c = $('#consent').is(':checked');                       // consent checkbox
    $('#consent').closest('div').find('.err').text(c ? '' : 'Please tick the consent box.');
    if(!c) ok = false;
    if(ok){ SITE.sfx.success(); this.reset(); $('#ok').show().get(0).scrollIntoView({behavior:'smooth', block:'center'}); }
    else { SITE.sfx.error();   // buzz + jump to the first problem
      $(this).find('[aria-invalid=true]').first().focus(); }
  });
});
