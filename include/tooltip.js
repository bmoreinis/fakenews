
function FNF_Tooltip( forElement, message, pos ) {
	if ( forElement ) {
		this.el = this.create( forElement, message, pos );
	}
}

FNF_Tooltip.prototype = {
	el: null,
	arrowOffset: 10,

	get: function() {
		return this.el;
	},

	create: function( forElement, message, pos ) {
		pos = pos || 'bottom';
		const tooltip = document.createElement( 'div' );
		tooltip.className = 'tooltip';
		
		if ( message ) {
			this.setMessage( message );
		}

		if ( forElement ) {
			tooltip.style.top = ( this.arrowOffset + forElement.offsetTop + forElement.offsetHeight ) + 'px';
			tooltip.style.left = forElement.offsetLeft + 'px';
			forElement.parentNode.appendChild( tooltip );
		}
		return tooltip;
	},

	setMessage: function( message ) {
		this.el.innerHTML = message;
		return this;
	},

	destroy: function() {
		if ( this.el ) {
			var p = this.el.parentNode;
			if ( p ) {
				p.removeChild( this.el );
			}

			this.el = null;
		}
	},

	animate: function( andDestroy ) {
		if ( this.el ) {
			this.el.setAttribute( 'data-animate', 1 );

			setTimeout( function() {
				this.el.removeAttribute( 'data-animate' );

				if ( andDestroy ) {
					this.destroy();
				}
			}.bind(this), 5000 );
			// Duration should correspond with CSS animation duration.
		}

		return this;
	}
};
