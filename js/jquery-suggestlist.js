( function( $ ) {

	function Suggestlist( element, options ) {
		var that = this;
		this.element = $( element ).attr( 'autocomplete', 'off' ).addClass( 'suggestlist-input' );
		this.options = $.extend( $.fn.suggestlist.defaults, options );
		this.picker = DPGlobal.render( options ).on( 'click.suggestlist', 'li', $.proxy( this.clickLi, this ) );
		this.isInput = this.element.is( 'input' );
		this.destroy = function() {
			that.hide();
			that.picker.remove();
			that.element.off('.suggestlist').removeData( 'suggestlist' )
		}
		
		this.picker.width( this.element.outerWidth() );
		$( document ).on( 'mousedown.suggestlist', function ( event ) {
			// Clicked outside the datepicker, hide it
			if ( $( event.target ).closest( '.suggestlist, .suggestlist-input' ).length == 0 ) {
				that.hide();
			}
		});
		if ( this.isInput ) {
			this.element.on( {
				//'focus.suggestlist': $.proxy( this.show, this ),
				'focus.suggestlist': $.proxy( this.click, this ),	// click, since focus should also work after form reset
				'click.suggestlist': $.proxy( this.click, this ),
				'keydown.suggestlist': $.proxy( this.keydown, this ),
				'keyup.suggestlist': $.proxy( this.updateLi, this )
			} );
			
			// use this as a mutex, to prevent this.click() being called while it's still
			// executing; this is to handle 'focus' and 'click' events firing simultaneously 
			// on mouse click
			this.clicked = false;
			
			this.updateLi();
		}
	}

	Suggestlist.prototype = {
		constructor: Suggestlist,
		
		click: function( event ) {
			
			// check if click is still executing
			if (this.clicked) {
				return;
			}
			// start executing click
			this.clicked = true;
			
			this.reset();
			if ( this.picker.is( ':hidden' ) ) {
				this.show();
			}
		},

		clickLi: function( event ) {
			this.picker.find( 'li.suggestlist-selected' ).removeClass( 'suggestlist-selected' );
			$( event.currentTarget ).addClass( 'suggestlist-selected' );
			this.updateVal();
			
			this.element[0].focus();
			// focus will cause list to show, so hide it
			this.picker.hide();
		},

		keydown: function( event ) {
			switch( event.keyCode ) {
			case 27: // ESC
				this.hide();
				event.preventDefault();
				break;
			case 9: // Tab
				this.hide();
				break;
			case 38: // Up
				if ( this.picker.is( ':not(:visible)' ) ) {
					this.show();
					return;
				}
				this.selectPrev();
				break;
			case 40: // Down
				if ( this.picker.is( ':not(:visible)' ) ) {
					this.show();
					return;
				}
				this.selectNext();
				break;
			case 13: // Enter
				if ( this.picker.is( ':visible' ) ) {
					this.updateVal();
					event.preventDefault();
				}
				break;
			}
		},

		show: function( event ) {
			this.picker.show();
			this.place();
			
			$( window ).on( 'resize.suggestlist', $.proxy( this.place, this ) );
			if ( event ) {
				event.stopPropagation();
				event.preventDefault();
			}
			// click has finished executing, ready to be called again
			if (this.clicked) {
				this.clicked = false;
			}
		},

		hide: function( event ) {
			this.picker.hide();
			$( window ).off( 'resize', $.proxy( this.place, this ) );
			
			// click is ready to be called if dropdown in hidden
			if (this.clicked) {
				this.clicked = false;
			}
		},

		place: function() {
			var offset = this.element.offset();
			this.picker.css( {
				left: offset.left,
				top: offset.top + this.element.outerHeight()
			} );
		},

		selectNext: function() {
			var $selected, $target;
			$selected = this.picker.find( 'li.suggestlist-selected' ).first();

			if ( $selected.length === 0 ) {
				$target = this.picker.find( 'li' ).first();
			} else {
				if ( $selected.is( ':last-child' ) ) {
					return;
				}
				$target = $selected.removeClass( 'suggestlist-selected' ).next();
			}
			$target.addClass( 'suggestlist-selected' );
		},

		selectPrev: function() {
			var $selected, $target;
			$selected = this.picker.find( 'li.suggestlist-selected' ).first();

			if ( $selected.length === 0 ) {
				$target = this.picker.find( 'li' ).last();
			} else {
				if ( $selected.is( ':first-child' ) ) {
					return;
				}
				$target = $selected.removeClass( 'suggestlist-selected' ).prev();
			}
			$target.addClass( 'suggestlist-selected' );
		},

		updateVal: function() {
			this.element.val( this.picker.find( 'li.suggestlist-selected' ).text() );
			this.hide();
		},
		
		/* 
		 * Reset selection in suggestion list
		 */
		reset: function(event) {
			var val = ( this.element.val() ).replace(/\s+/, ' '), 
				$li = this.picker.find( 'li' ),
				$selected = $li.filter( '.suggestlist-selected' ).first();
			
			if ( val === $selected.text() ) {
				return;
			}
			
			$selected.removeClass( 'suggestlist-selected' );
			
			// only first match to be highlighted in case of multiple matches
			var selectedFlag = false;
			this.picker.find( 'li' ).each( function( i, elem ) {
				// a match was already found
				if (selectedFlag) {
					return;
				}
				// check if a list item starts with val
				if ( $(elem).text() === val) {
					$( elem ).addClass( 'suggestlist-selected' );
					selectedFlag = true;
				}
			} );
			
		},
		
		updateLi: function( event ) {
			if ( event ) {
				var keyVal = String.fromCharCode( event.keyCode ).toLowerCase();
				if ( event.ctrlKey || ! /^[0-9a-z ]$/.test( keyVal ) ) {
					return;
				}
			}
			
			var val = ( this.element.val() ).replace(/\s+/, ' '),
				$li = this.picker.find( 'li' ),
				$selected = $li.filter( '.suggestlist-selected' ).first();
				
			if ( val === $selected.text() ) {
				return;
			}
			
			$selected.removeClass( 'suggestlist-selected' );
			// only first match to be highlighted in case of multiple matches
			var selectedFlag = false;
			this.picker.find( 'li' ).each( function( i, elem ) {
				// a match was already found
				if (selectedFlag) {
					return;
				}
				// check if a list item starts with val
				if ( $(elem).text().indexOf(val) === 0) {
					$( elem ).addClass( 'suggestlist-selected' );
					selectedFlag = true;
				}
			} );
			if ( event ) {
				this.show();
			}
		}

	};
	
	

	var DPGlobal = {
		render: function( options ) {
			var $list = $( '<ul/>' ), i;
			$list.addClass( 'suggestlist' )
				.css( {
					zIndex: getClosestZIndex( this.element )
				} );

			for( i = 0; i < options.list.length; i++ ) {
				$list.append( '<li>' + options.list[i] + '</li>' );
				if ( i === 0 ) {
					$list.addClass( 'suggestlist-selected' );
				}
			}
			$list.appendTo( 'body' );
			return $list;
		}
	};

	/* Helper functions */
	function getClosestZIndex( elem ) {
		if ( !elem ) return;
		return parseInt( elem.parents().filter( function() {
			return $( this ).css( 'z-index' ) !== 'auto';
		} ).first().css( 'z-index' ), 10 );
	};


	/* Add suggestlist to jQuery */
	$.fn.suggestlist = function( option) {
		var args = Array.apply(null, arguments);
		args.shift();
		return this.each( function () {
			var $this = $( this ),
				data = $this.data( 'suggestlist' ),
				options = typeof option == 'object' && option;
			if ( !data ) {
				data = new Suggestlist( this, $.extend({}, $.fn.suggestlist.defaults, options ) );
				$this.data( 'suggestlist', data);
			}
			if (typeof option == 'string' && typeof data[option] == 'function') {
				data[option].apply(data, args);
			}
		});
	}

	$.fn.suggestlist.defaults = {
		list: []
	};
	
	/*
	$.fn.reset = function() {
		var $this = $( this );
		var suggestlist = $this.data().suggestlist;
		// reset suggestlist
		suggestlist.reset();
	};*/

} ) ( jQuery );
