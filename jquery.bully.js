/*!
 * jQuery Bully Plugin v0.1.0
 * Examples and documentation at http://pixelgrade.github.io/rellax/
 * Copyright (c) 2016 PixelGrade http://www.pixelgrade.com
 * Licensed under MIT http://www.opensource.org/licenses/mit-license.php/
 */
;(function ($, window, document, undefined) {

    var $window = $(window),
        windowWidth = $window.width(),
        windowHeight = $window.height(),
        elements = new Array(),
        $bully,
        bullyOffset,
        lastKnownScrollY,
        current = 0,
        inversed = false;

    $bully = $( '<div class="c-bully">' ).appendTo( 'body' );
    bullyOffset = $bully.offset();
    $current = $( '<div class="c-bully__bullet c-bully__bullet--active">' ).appendTo( $bully );

    (function update() {
        var count = 0,
            inverse = false;

        $.each(elements, function(i, element) {
            if ( lastKnownScrollY >= element.offset.top - windowHeight / 2 ) {
                count = count + 1;
                inverse = true;

                if ( lastKnownScrollY >= element.offset.top + element.height - windowHeight / 2 ) {
                    inverse = false;
                }
            }
        });

        if ( inversed !== inverse ) {
            inversed = inverse;
            $bully.toggleClass( 'c-bully--inversed', inversed );
        }

        if ( count !== current ) {
            var offset = $bully.children( '.c-bully__bullet' ).first().outerHeight( true ) * ( count - 1 );
            $current.css( 'top', offset );
            current = count;
        }

        window.requestAnimationFrame(update);
    })();

    function reloadAll() {
        $.each(elements, function(i, element) {
            element._reloadElement();
        });
    }

    $window.on('load scroll', function(e) {
        lastKnownScrollY = $(e.target).scrollTop();
    });

    $window.on('load resize', reloadAll);

    function Bully(element, options) {
        this.element = element;
        this.options = $.extend({}, $.fn.bully.defaults, options);

        var self = this,
            $bullet = $( '<div class="c-bully__bullet">' );

        $bullet.data( 'bully-data', self ).appendTo( $bully );
        $bullet.on( 'click', function( event ) {
            event.preventDefault();
            event.stopPropagation();

            self.onClick();
        });

        self._reloadElement();
        elements.push(self);
        current = 0;
    }

    Bully.prototype = {
        constructor: Bully,
        _reloadElement: function() {
            this.offset = $(this.element).offset();
            this.height = $(this.element).outerHeight();
        },
        onClick: function() {

            var self = this;

            if ( self.options.scrollDuration == 0 ) {
                $( 'html, body' ).scrollTop( self.offset.top );
            }

            $( 'html, body' ).animate({
                scrollTop: self.offset.top
            }, self.options.scrollDuration );
        }
    }

    $.fn.bully = function ( options ) {
        return this.each(function () {
            if ( ! $.data(this, "plugin_" + Bully) ) {
                $.data(this, "plugin_" + Bully, new Bully( this, options ));
            }
        });
    }

    $.fn.bully.defaults = {
        scrollDuration: 600
    };

    $('[data-bully]').bully();

})( jQuery, window, document );
