// Looking up the css background color is expensive, so cache the results
var colorValueCache = {};
function getColorValues(label) {
  var classes = label.className;
  if (!colorValueCache[classes]) {
    var color = $(label).css("background-color");
    colorValueCache[classes] = color.replace("rgb", "").replace("(", "").replace(")", "").split(",");
    
    colorValueCache[classes][0] = parseInt(colorValueCache[classes][0]);
    colorValueCache[classes][1] = parseInt(colorValueCache[classes][1]);
    colorValueCache[classes][2] = parseInt(colorValueCache[classes][2]);
  }
  
  return colorValueCache[classes];
}

function colorizeCards($cards) {
  $cards.each(function (i, card) {
    var $card = $(card);
    var $labels = $card.find('span.card-label');

    if ($labels.size()) {
      var r = 0;
      var g = 0;
      var b = 0;

      if (shouldMerge()) {
        $labels.each(function (j, label) {
          var colorArray = getColorValues(label);

          r = ((j * r) + colorArray[0]) / (j + 1);
          g = ((j * g) + colorArray[1]) / (j + 1);
          b = ((j * b) + colorArray[2]) / (j + 1);
        });
      } else {
        var colorArray = getColorValues($labels[0]);

        r = colorArray[0];
        g = colorArray[1];
        b = colorArray[2];
      }

      // Averaging with #e3e3e3 to lighten the colour and make it appropriate for a background
      r = (r + 227) / 2;
      g = (g + 227) / 2;
      b = (b + 227) / 2;

      var rgb = 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';

      if ($card.data('cardColorsForTrello.bgColor') !== rgb) {
        $card.css("background-color", rgb);
        
        $card.data('cardColorsForTrello.bgColor', rgb);
      }

      var $cardDetails = $card.find('.list-card-details');
      if (!$cardDetails.data('cardColorsForTrello.initStyles')) {
        $cardDetails.css("background-color", "transparent");
        
        $cardDetails.data('cardColorsForTrello.initStyles', true);
      }
      
      var $stickers = $card.find('.sticker');
      $.each($stickers, function(i, sticker){
        var $sticker = $(sticker);
        var stickerOpacity = parseInt($sticker.css("top")) > 5 ? ".4" : "1";
        
        if ($sticker.data('cardColorsForTrello.opacity') !== stickerOpacity) {
          $sticker.css("opacity", stickerOpacity);
          
          $sticker.data('cardColorsForTrello.opacity', stickerOpacity);
        }
      });

      var $badges = $card.find('.badges');
      if (!$badges.data('cardColorsForTrello.initStyles')) {
        $badges.css("background-color", "rgba(255,255,255,0.7)");
        $badges.css("padding", "2px 2px 0 2px");
        $badges.css("margin-bottom", "2px");
        $badges.css("border-radius", "3px");
        
        $badges.data('cardColorsForTrello.initStyles', true);
      }

      if (shouldMerge()) {
        if (!$labels.data('cardColorsForTrello.hidden')) {
          $labels.hide();
          
          $labels.data('cardColorsForTrello.hidden', true);
        }
      } else {
        if ($labels.data('cardColorsForTrello.hidden')) {
          $labels.show();
          
          $labels.data('cardColorsForTrello.hidden', false);
        }
      }
    } else {
      if ($card.data('cardColorsForTrello.bgColor')) {
        $card.css("background-color", "");
        
        $card.data('cardColorsForTrello.bgColor', null);
      }
    }
  });
}

var iteration = 0;
function colorize() {
  // Only process "pirate-aged" cards every 10th iteration
  // When a label is applied, the card should become de-pirated anyway and get processed immediately
  if (iteration % 10 === 0) {
    colorizeCards($('div.list-card'));
  } else {
    colorizeCards($('div.list-card:not(.aging-pirate), div.list-card.aging-level-0'));
  }
  
  iteration++;
  
  setTimeout(colorize, 500);
};

function shouldMerge() {
    return (localStorage.getItem('cardColorsMerge') || 'true') === 'true';
}

function setMergeStatus(state) {
  var $button = $('.card-colors-merge-toggle-btn > .board-header-btn-text');

  if (state) {
    localStorage.setItem('cardColorsMerge', "true");
    $button.text('Card Colors: Merge');
  } else {
    localStorage.setItem('cardColorsMerge', "false");
    $button.text('Card Colors: Use first label');
  }
}

function createMergeToggleButton() {
  // Wait until at least one list card has been rendered
  if (!$('.list-card').length) {
    setTimeout(createMergeToggleButton, 1000);
    return;
  }
  var $toggleButton = $('<a class="board-header-btn card-colors-merge-toggle-btn" href="#">' +
    '<span class="board-header-btn-icon icon-sm icon-card-cover"></span>' +
    '<span class="board-header-btn-text" title="Merge card labels, or use the first label as card color">Card Colors: Merge</span>' +
    '</a>');

  $toggleButton.on('click', function() {
    setMergeStatus(!shouldMerge());
  });

  $('.board-header-btns.mod-left').append($toggleButton);

  setMergeStatus(shouldMerge());
};

$(document).ready(function() {
  createMergeToggleButton();
  colorize();
});
