/*!
 * jQuery Rellax Plugin v0.3.3
 * Examples and documentation at http://pixelgrade.github.io/rellax/
 * Copyright (c) 2016 PixelGrade http://www.pixelgrade.com
 * Licensed under MIT http://www.opensource.org/licenses/mit-license.php/
 */
;(
    function( $, window, document, undefined ) {

        if ( ! window.requestAnimationFrame ) {
            return;
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
            _reloadElement: function() {
                this.$el.removeAttr( 'style' );

                this.offset = this.$el.offset();
                this.height = this.$el.outerHeight();
                this.width = this.$el.outerWidth();

                if ( this.parent === undefined ) {
                    this.offset.top -= this.options.bleed;
                    this.height += 2 * this.options.bleed;
                }
            },
            _scaleElement: function() {
                var parentHeight = this.$parent.outerHeight(),
                    parentWidth = this.$parent.outerWidth(),
                    scaleY = ( parentHeight + ( windowHeight - parentHeight ) * ( 1 - this.options.amount ) ) / this.height,
                    scaleX = parentWidth / this.width,
                    scale = Math.max(scaleX, scaleY);

                this.width = this.width * scale;
                this.height = this.height * scale;

                this.offset.top = ( parentHeight - this.height ) / 2;
                this.offset.left = ( parentWidth - this.width ) / 2;
            },
            _prepareElement: function() {
                if ( this.parent === undefined ) {
                    this.$el.addClass( 'rellax-element' );
                    this.$el.css({
                        position: 'fixed',
                        top: this.offset.top,
                        left: this.offset.left,
                        width: this.width,
                        height: this.height
                    });
                } else {
                    this._scaleElement();
                    this.$el.css({
                        position: 'absolute',
                        top: this.offset.top,
                        left: this.offset.left,
                        width: this.width,
                        height: this.height
                    });
                }
            },
            _setParentHeight: function() {
                if ( this.parent == undefined ) {
                    var $parent = this.$el.parent(),
                        parentHeight = $parent.css( 'minHeight', '' ).outerHeight();

                    parentHeight = windowHeight < parentHeight ? windowHeight : parentHeight;
                    $parent.css( 'minHeight', parentHeight );
                }
            },
            _updatePosition: function( forced ) {
                var progress = this._getProgress(),
                    height = this.parent !== undefined ? this.parent.height : this.height,
                    move = ( windowHeight + height ) * ( progress - 0.5 ) * this.options.amount,
                    scale = 1 + ( this.options.scale - 1 ) * progress,
                    scaleTransform = scale >= 1 ? 'scale(' + scale + ')' : '';

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
            container: "[data-rellax-container]",
            reloadEvent: "ontouchstart" in window && "onorientationchange" in window ? "orientationchange debouncedresize" : "resize"
        };

        var $window = $( window ),
            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight ,
            lastScrollY = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0),
            frameRendered = true,
            elements = [];

        function render() {
            if ( frameRendered !== true ) {
                updateAll();
            }
            window.requestAnimationFrame( render );
            frameRendered = true;
        }

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

        function setHeights() {
            $.each(elements, function(i, element) {
                element._setParentHeight();
            });
        }

        function badRestart() {
            setHeights();
            reloadAll();
            prepareAll();
            updateAll( true );
        }

        var restart = throttle(badRestart, 300);

        function throttle(fn, threshhold, scope) {
            threshhold || (threshhold = 250);
            var last,
                deferTimer;
            return function () {
                var context = scope || this;

                var now = +new Date,
                    args = arguments;
                if (last && now < last + threshhold) {
                    // hold on to it
                    clearTimeout(deferTimer);
                    deferTimer = setTimeout(function () {
                        last = now;
                        fn.apply(context, args);
                    }, threshhold);
                } else {
                    last = now;
                    fn.apply(context, args);
                }
            };
        }

        function bindEvents() {

            $(document).ready(function() {
                restart();
                render();
            });

            $window.on( 'resize', function() {
                windowWidth = window.innerWidth;
                windowHeight = window.innerHeight;
            });

            $window.on( 'scroll', function() {
                if ( frameRendered === true ) {
                    lastScrollY = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
                }
                frameRendered = false;
            });

            $window.on( 'rellax load ' + $.fn.rellax.defaults.reloadEvent, function(e) {
                restart();
            });
        }

        bindEvents();
    }
)( jQuery, window, document );
