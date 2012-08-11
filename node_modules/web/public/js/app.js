$(function() {
  $('.navbar ul.nav a').click(function(e) {
    e.preventDefault();
    $.scrollTo($(this).attr('href'), 1200, { offset: { top: -40, left: 0}});
  });
});