/**
 * knockout-validated | (c) 2012 Aurélien Basille | http://www.opensource.org/licenses/mit-license
 * 
 * Require: knockout.js (https://github.com/SteveSanderson/knockout).
 * 
 * Inspired by the Ryan Niemeyer's blog article "Guard Your Model: Accept or Cancel Edits to Observables in KnockoutJS"
 * (http://www.knockmeout.net/2011/03/guard-your-model-accept-or-cancel-edits.html).
 * 
 * This wrapper implements a validation chain in order to set a ko.observable() object only if all the functions of this validation chain have
 * accepted the new value (by returning TRUE).
 * 
 * Usage :
 * 
 * <code>
 * var o = ko.validatedObservable(123);
 * 
 * // Add a validator rule: Only accept value > 100
 * o.addValidator( function(newValue) { return (newValue > 100); });
 * 
 * o(50)  // Will silently fail because 50 < 100
 * o(500) // Succeed
 * </code>
 */
;
(function(ko)
{
	ko.validatedObservable = function(initValue)
	{
		var _value = ko.observable();
		var _lastValue;
		var _validationChain = [];

		/**
		 * L'objet fonction retourné suite à l'appel de ko.validatedObservable().
		 */
		var _o = ko.computed({
			read : function()
			{
				return _value();
			},

			write : function(newValue)
			{
				_lastValue = _value();

				if (runValidationChain(newValue))
				{
					// Affecte l'objet avec la valeur acceptées par l'ensemble des valideurs.
					_value(newValue);
				}
				else
				{
					// Averti les écouteurs de la variable que la nouvelle valeur a été refusée par la chaine de validation (CU: MAJ de la vue)
					_value.valueHasMutated();
				}
			}
		});

		/**
		 * Ajoute une fonction validatrice en fin de chaîne de validation de la variable _value afin d'accepter ou de refuser toutes les nouvelles
		 * valeurs d'affectation.
		 * 
		 * @param validationFunct {function} Une fonction acceptant la nouvelle valeur d'affectation de la variable et retournant un booléen
		 *            correspondant à l'acceptation ou non de la nouvelle valeur d'affectation de _value.
		 * @return {validatedObservable} Retourne la l'objet validatedObservable() pour permettre le mécanisme de cascade.
		 * @visibilty public
		 */
		_o.addValidator = function(validationFunct)
		{
			if (typeof validationFunct !== 'function')
			{
				throw "Invalid argument for addValidator() - Argument 1 MUST be a function";
			}

			if (_validationChain.indexOf(validationFunct) === -1)
			{
				_validationChain.push(validationFunct);
			}
			return _o;
		};

		/**
		 * Retire une fonction validatrice de la chaîne de validation de la variable _value.
		 * 
		 * @param validationFunct {function} Une fonction validatrice précédemment ajoutée à la chaîne de validation.
		 * @visibilty public
		 * @return {validatedObservable} Retourne la l'objet validatedObservable() pour permettre le mécanisme de cascade.
		 */
		_o.removeValidator = function(validationFunct)
		{
			var _index;

			if (typeof validationFunct !== 'function')
			{
				throw "Invalid argument for removeValidator() - Argument 1 MUST be a function";
			}

			if ((_index = _validationChain.indexOf(validationFunct)) !== -1)
			{
				_validationChain.splice(_index, 1);
			}
			return _o;
		};

		/**
		 * Retourne true si la _value a été modifiée lors de la dernière tentative d'affectation.
		 * 
		 * @visibility public
		 * @return {boolean}
		 */
		_o.hasChanged = function()
		{
			return (_value() !== _lastValue);
		};

		/**
		 * Appelle chaque valideur de la chaîne avec la nouvelle valeur de l'objet.
		 * 
		 * @visibilty private
		 * @returns {Boolean} True si tous les valideurs ont accepté la nouvelle valeur.
		 */
		var runValidationChain = function(newValue)
		{
			var _isValid = true;
			var _index = 0;

			// Parcours la chaîne jusqu'à sa fin tant qu'aucun valideur n'a rejeté la nouvelle valeur.
			while (_isValid && _index < _validationChain.length)
			{
				_isValid = _validationChain[_index](newValue);
				_index++;
			}
			return _isValid;
		};

		return _o;
	};
})(ko);
