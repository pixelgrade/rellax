/*!
 * jQuery Rellax Plugin v0.3.0
 * Examples and documentation at http://pixelgrade.github.io/rellax/
 * Copyright (c) 2016 PixelGrade http://www.pixelgrade.com
 * Licensed under MIT http://www.opensource.org/licenses/mit-license.php/
 */
;(
    function( $, window, document, undefined ) {

        if ( ! window.requestAnimationFrame ) {
            return;
        }

        var $window = $( window ),
            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight,
            lastScrollY = window.scrollY,
            elements = [];

        function loop() {
            if ( frameRendered !== true ) {
                updateAll();
            }
            window.requestAnimationFrame( loop );
            frameRendered = true;
        }

        $window.on( 'resize', function() {
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;

            requestAnimationFrame(reloadAll);
            requestAnimationFrame(prepareAll);
            requestAnimationFrame(function() {
                updateAll( true );
            });
        } );

        var frameRendered = true;

        $window.on( 'scroll', function() {
            if ( frameRendered === true ) {
                lastScrollY = window.scrollY;
            }
            frameRendered = false;
        } );

        $window.on( 'load', function() {
            reloadAll();
            prepareAll();
            requestAnimationFrame(function() {
                updateAll( true );
            });
            $.each(elements, function(i, element) {
                element.$el.addClass( 'rellax-active' );
            });
            window.requestAnimationFrame( loop );
        });

        function updateAll( forced ) {
            $.each(elements, function(i, element) {
                element._updatePosition( forced );
            });
        }

        function reloadAll() {
            $.each(elements, function(i, element) {
                element._reloadElement();
            });
        }

        function prepareAll() {
            $.each(elements, function(i, element) {
                element._prepareElement();
            });
        }

        function Rellax( element, options ) {
            this.$el = $( element );
            this.options = $.extend( $.fn.rellax.defaults, options );
            this.$parent = this.$el.parent().closest( this.options.container );
            this.parent = this.$parent.data( "plugin_" + Rellax );

            var $el = this.$el,
                amount = $el.data( 'rellax-amount' ),
                bleed = $el.data( 'rellax-bleed' ),
                fill = $el.data( 'rellax-fill' ),
                scale = $el.data( 'rellax-scale' );

            this.options.amount = amount !== undefined ? parseFloat( amount ) : this.options.amount;
            this.options.bleed = bleed !== undefined ? parseFloat( bleed ) : this.options.bleed;
            this.options.scale = scale !== undefined ? parseFloat( scale ) : this.options.scale;
            this.options.fill = fill !== undefined;

            if ( this.options.amount == 0 ) {
                return;
            }

            elements.push( this );
        }

        $.extend( Rellax.prototype, {
            constructor: Rellax,
            _bindEvents: function() {

            },
            _scaleElement: function() {
            },
            _reloadElement: function() {
                this.$el.removeAttr( 'style' );
                this.$el.removeClass( 'rellax-element' );

                this.offset = this.$el.offset();
                this.height = this.$el.outerHeight();
                this.width = this.$el.outerWidth();

                this.offset.top -= this.options.bleed;
                this.height += 2 * this.options.bleed;

                if ( this.parent !== undefined ) {
                    this.height = windowHeight - ( windowHeight - this.parent.height ) * ( 1 - this.options.amount );
                    this.offset.top = ( this.parent.height - this.height ) / 2;
                }

                if ( this.parent === undefined && this.$parent.length ) {
                    var parentHeight = this.$parent.outerHeight();

                    this.height = windowHeight - ( windowHeight - parentHeight ) * ( 1 - this.options.amount );
                    this.offset.top = ( parentHeight - this.height ) / 2;
                }
            },
            _prepareElement: function() {
                if ( this.parent == undefined ) {
                    this.$el.addClass( 'rellax-element' );
                    this.$el.css({
                        position: 'fixed',
                        left: this.offset.left,
                        top: this.offset.top,
                        width: this.width,
                        height: this.height
                    });
                } else {
                    this.$el.css({
                        position: 'absolute',
                        top: this.offset.top,
                        height: this.height
                    });
                }
            },
            _isInViewport: function( offset ) {
                return lastScrollY > this.offset.top - windowHeight + offset && lastScrollY < this.offset.top + windowHeight + offset;
            },
            _updatePosition: function( forced ) {
                var progress = this._getProgress(),
                    height = this.parent !== undefined ? this.parent.height : this.height,
                    move = ( windowHeight + height ) * ( progress - 0.5 ) * this.options.amount,
                    scale = 1 + ( this.options.scale - 1 ) * progress,
                    scaleTransform = scale > 1 ? 'scale(' + scale + ')' : '';

                if ( this.parent === undefined && this.$parent.length ) {
                    move *= -1;
                }

                if ( forced !== true && ( progress < 0 || progress > 1 ) ) {
                    this.$el.addClass( 'rellax-hidden' );
                    return;
                }

                this.$el.removeClass( 'rellax-hidden' );

                this.$el.data( 'progress', progress );

                if ( this.$el.is( this.options.container ) ) {
                    this.$el.css( 'transform', 'translate3d(0,' + ( - lastScrollY ) + 'px,0)' );
                } else {
                    this.$el.css( 'transform', 'translate3d(0,' + move + 'px,0) ' + scaleTransform );
                }
            },
            _getProgress: function() {
                if ( this.parent !== undefined ) {
                    return parseFloat( this.$parent.data( 'progress' ) );
                } else {
                    return ( ( lastScrollY - this.offset.top + windowHeight ) / ( windowHeight + this.height ) );
                }
            }
        } );

        $.fn.rellax = function( options ) {
            return this.each( function() {
                if ( ! $.data( this, "plugin_" + Rellax ) ) {
                    $.data( this, "plugin_" + Rellax, new Rellax( this, options ) );
                } else {
                    var self = $.data( this, "plugin_" + Rellax );
                    if ( options && typeof options === "string" ) {
                        if ( options == "refresh" ) {
                            self._reloadElement();
                        }
                    }
                }
            } );
        };

        $.fn.rellax.defaults = {
            amount: 0.5,
            bleed: 0,
            scale: 1,
            container: '[data-rellax-container]'
        };

    }
)( jQuery, window, document );
