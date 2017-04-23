/* CraftmanLab/MiniClient - hive.js
 * Author: craftmanlab@gmail.com
 */
var client_ver = "4.0.2", _client = "craftmanlab@gmail.com", _root, _buffer;

/* Global options for UC Client, can be overrided by re-declare it under proper script loading order. */
var hive_options = {
	client_ext:		"untitled-app",
	server:			location.href,
	url_home:		location.pathname,
	start_auth:		false,
	start_request:	"",
	start_execute:	"",
	ui_auto:		true,				// jQuery(this.root).html(response.ui);
	flag:			""
};

/* Deafult onload() | can be disabled by declaring UNICORE_DISABLE_AUTO_INIT at app-only script */
jQuery(document).ready(function(){
	if (typeof _client != 'object') {
		_client = new hive.client(typeof hive_options === 'object' ? hive_options : {});
	}
	else if (('hive' in _client) && _client.hive === "HiveClientObject") {
		if (typeof console === 'object') { console.log("Error: An Hive Client Object is already instantiated as window._client."); }
	}
	else {
		if (typeof console === 'object') { console.log("Error: Possible variable name conflict, window._client already instantiated."); }
	}
});

// Namespace
var hive = hive || {};

// Class Constructor
hive.client = function(set_options)
{
	/* Statics */
	this.hive				= "HiveClientObject";
	this.client_ver				= client_ver;
	this.client_ext				= "untitled";
	/* Options */
	this.root					= "#hive-root",
	this.buffer					= "#hive-buffer",
	this.instance				= "_client";
	this.homepage				= location.pathname;
	this.server					= location.href;
	this.start_auth 			= false;
 	this.start_request			= "";
 	this.start_execute			= "";
	// Dev Options
	this.debug_trace_fallback_alert	= false;	// When console object is not available.
	this.debug_trace_history_limit	= 0;		// How many trace log to be stored.
	/* Status */
	this.is_ready				= false;
	this.is_paused				= false;
	this.is_user_script_loaded	= false;
	this.is_authenticated		= false;
	
	/* Rub Time Vars */
	this.meta					= false;
	
	/* Auto UI */
	this.ui_auto				= true;
	//this.auto_ui_button 	 	= true,		// jQuery("button").button();
	//this.auto_ui_input_button	= true,		// jQuery("input[type='button']").button();
	/* For Tweaks and Dev */
	this.flag					= "";  
	this.view					= jQuery("body").data("view");
	
	/* Extend (oevrride) properties if set_options object given */
	if (typeof set_options == "object") {
		jQuery.extend(this, set_options);
	}

	/* Hive Root */
	this.$root	= jQuery(this.root);
	
	this.debug	= jQuery(this.root) ? jQuery(this.root).hasClass("mode-dev") : false;
	
	this.viewport = {
		height: $(window).height(),
		width: $(window).width()
	};
	
	/* UI Buffer */
	// this.$buffer	= jQuery(this.buffer);
	
	if (this.$root.size() != 1){
		this.trace("w:uc-root-el-not-exist", 'warn', true);
	}
	
	// Script identification
	this.core_string = "Hive Client " + this.client_ver + (this.client_ext === "" ? "" : ("." + this.client_ext)) + " with jQuery " + jQuery().jquery;
	this.trace(this.core_string, "info"); // TODO
	
	/* Init debug settings */
	if (typeof DEBUG == 'undefined') window.DEBUG = this.debug;
	
	// Delegated events...
	this.init();
	
	/* Startup execute (Local function) */
	if (typeof this.start_execute === 'string' && this.start_execute != ""){
		this.execute(this.start_execute);
	}
	/* Startup request (AjAX request)*/ 
	if (typeof this.start_request === 'string' && this.start_request != ""){
		this.request(this.start_request);
	}
	
	// TODO does the order concerned?
	/* Bind handler for window and document events */
	$(window).resize(function(e){ _client._global_event_window_resize(e); });
	
};

hive.client.prototype._global_event_window_resize = function(e)
{
	// Update viewport size
	this.viewport = {
		height: $(window).height(),
		width: $(window).width()
	};
	// Adjust element with dynamic height / width relative to view-port size
	$(".uc-auto-resize").each(function(){
		if ($(this).data("uc-max-height")) {
			var max_height = (_client.viewport.height + $(this).data("uc-max-height")) + "px";
			$(this).css("max-height", max_height);
		}
		if ($(this).data("uc-max-width")) {
			var max_width = (_client.viewport.width + $(this).data("uc-max-width")) + "px";
			$(this).css("max-width", max_width);
		}
		if ($(this).data("uc-height")) {
			var max_height = (_client.viewport.height + $(this).data("uc-height")) + "px";
			$(this).css("max-height", max_height);
		}
		if ($(this).data("uc-width")) {
			var max_width = (_client.viewport.width + $(this).data("uc-width")) + "px";
			$(this).css("max-width", max_width);
		}
	});
	
	if (typeof this._event_window_resize === 'function') {
		this._event_window_resize(e);
	}
};

hive.client.prototype.init = function()
{
	console.info("craftmanlab/miniclient | craftmanlab@gmail.com");
	if (this.ui_auto){
		this.ui_build();
	}
	
	// Actions Triggers
	var _this = this;
	
	$("body").delegate(".uc-auto-request, .uc-request-trigger", "click", function(e){
		// Disabled (<button> only) // Should be handled by browser
		// if (jQuery(this).prop("disabled")){
			// _this.trace(".uc-request-trigger.disabled");
			// return false;
		// }
		if ($(this).data("request")) {
			e.preventDefault();
			// Call automation method.
			var request_automated = _this.request_automated(e);
			// Return null means no custom handler was defined >> send standard request.
			if (request_automated === null){
				_this.trace("m.request_automated.standard-ajax-request");
				var data = $(this).data();
				data.flag = (e.altKey ? "--e.altKey" : "") + (e.ctrlKey ? "--e.ctrlKey" : "") + (e.shiftKey ? "--e.shiftKey" : "");
				_this.request({data: data});
			}
		}
		else if ($(this).data("handler")) {
			e.preventDefault();
			// Evil
			var handler = $(this).data("handler");
			if (handler in _client) {
				eval("_client." + handler + "(undefined, e);");
			}
			else {
				_this.trace("m.request_automated.data-request:handler.absent");
			}
		}
		else {
			_this.trace("m.request_automated.data-request:absent");
		}
	});
	
	// jQuery("body").delegate(".uc-form-auto-request", "submit", function(e){
	$("body").delegate(".uc-form-auto-request", "submit", function(e){
		e.preventDefault();
		_client._form_auto_request(e);
	});
	
	// ??
	$("body").delegate(".uc-auto-action", "click", function(e){
		_this.trace(".uc-auto-action.clicked");
		_this._auto_action(e);
	});
	
	// Input group: trigger parent input.click()
	$('body').delegate('.input-group .input-group-btn .btn-click-parent-input', 'click', function(e){
	     $(this).closest(".input-group").find("input").trigger("click");
	});
	// Input group: clear parent input button
	$('body').delegate('.input-group .input-group-btn .btn-clear-parent-input', 'click', function(e){
		var $input = $(this).closest(".input-group").find("input");
		if ($input.prop('readonly')) {
			_client.trace('Read-only input skipped.', null, true);
		}
		else if ($input.prop('disabled')){
			_client.trace('Disabled input skipped.', null, true);
		}
		else{
			$(this).closest(".input-group").find("input").val("");
		}
	});
	
	// Init for diff class of users
	if ('init_public' in this && typeof this.init_public == 'function') this.init_public();
	if ('init_user' in this && typeof this.init_user == 'function') this.init_user();
	if ('init_admin' in this && typeof this.init_admin == 'function') this.init_admin();

	this.initPlugins();
	this.initBootstrap();
	/*
	// Fix z-indexes for Multiple BS Modals (http://stackoverflow.com/questions/19305821/multiple-modals-overlay)
	jQuery(document).on('shown.bs.modal', '.modal', function() {
		
		console.info("show.bs.modal" + $(this).prop("id"));
		
		var zIndex = 1000 + (10 * jQuery('.modal:visible').length);
		
		jQuery(this).css('z-index', zIndex);
		
		trace("m.show.bs.modal(fix2):zIndex=" + zIndex);
		setTimeout(function() {
			var zIndex = 1000 + (10 * jQuery('.modal:visible').length) - 1;
			trace(".modal:visible.length=" + jQuery('.modal:visible').length);
			jQuery('.modal-backdrop').each(function(key, el){
				trace(".modal-backdrop:zIndex=" + zIndex + "|" + key);
				$(this).css('z-index', zIndex);
				zIndex = zIndex - 10;
			});
			
			//trace("m.show.bs.modal(fix3):zIndex=" + zIndex);
			//jQuery('.modal-backdrop').not('.modal-stack').css('z-index', zIndex).addClass('modal-stack');
		}, 0);
	});
	*/
	// BS Multiple Modals (http://stackoverflow.com/questions/19305821/multiple-modals-overlay)
	// jQuery(document).on('show.bs.modal', '.modal', function() {
		// trace("m.show.bs.modal(fix)");
		// var zIndex = 1040 + (10 * jQuery('.modal:visible').length);
		// jQuery(this).css('z-index', zIndex);
		// setTimeout(function() {
			// jQuery('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
		// }, 0);
	// });
	
		
};

// Auto form-to-ajax-request
hive.client.prototype.initPlugins = function()
{
	// Pikaday https://github.com/dbushell/Pikaday
	if (typeof Pikaday == 'function') {
		// Instantiate
		$('.pikaday').each(function(){
			var pika = new Pikaday({
				field : this
			});
			// Remove class to prevent repeated event binding
			$(this).removeClass('pikaday').addClass('pikaday-controls');
		});
		// Disallow paste and type
		$(this.root).delegate('.pikaday-controls', 'keydown paste', function(e){
		     e.preventDefault();
		});
	}
	
};

// Some touch up for BS3
hive.client.prototype.initBootstrap = function()
{
	// Off-focus a clicked tab
	$('body').delegate('ul.nav-tabs > li > a, ul.nav-pills > li > a', 'click', function(e){
		$(this).blur();
	});
};



// Auto form-to-ajax-request
hive.client.prototype._form_auto_request = function(e)
{
	$el = $(e.currentTarget);
	if ($el.prop("tagName") === 'FORM'){
		
		if ($el[0].checkValidity()){
			var form_data = $el.serialize(); // TODO mind the scope
			if ($el.data("confirm")){
				_client.trace('_form_auto_request.confirmation');
				this.confirm({
					message: $el.data("confirm"),
					confirm: function(e){
						_client.trace('_form_auto_request.confirmed');
						form_data.action = $(this).data('action');
						_client.request({data: form_data});
					},
					cancel: function(){
						_client.trace('_form_auto_request.cancelled');
					}
				});
			}
			else {
				_client.trace('_form_auto_request.confirmation-no-set');
				_client.request({data: form_data});
			}
		}
		else {
			this.alert("Please fill out all fileds in required format unless specified optional.");
		}
	}
	else {
		_client.trace("e._form_auto_request:required-form-tag");
	}
};

hive.client.prototype.execute = function(cmd)
{
	// Handling response
	switch (cmd){
		case "debug":
			console.log(this);
			break;
		default:
			/* Undefined. */
	}
	/* Looking for local function hive.client.prototype.execute_extended function */
	if (typeof this.execute_extended === 'function'){
		this.trace("m:execute_extended-function-exists", true);
		this.execute_extended(cmd);
	}
};

hive.client.prototype.request = function(set_jquery_ajax_options)
{
	// Erase
	this.response = undefined;
	// Prepare
	var _this = this;
	var jquery_ajax_options = {
		context:	this,
		url:		this.server,
		type:		"POST",
		dataType:	"json",
		global:		true,
		data: 		{},
		callback:	null, // a function
		success: function(response){
			
			console.log('this.requestSuccess(response)');
			this.requestSuccess(response);
			console.log('this.requestSuccess.finish');
			return true;
			
			
			
			
			console.log(this);
			
			// Handlefor response of JSON request.
			if (typeof response === 'object'){
				// Default response handler
				_this._handle_response(response);
				// App-level response handler
				console.log1;
				_this.request_callback(response, jquery_ajax_options.callback);
			}
			else {
				trace("typeof response = " + typeof response);
			}
		},
		error: function(data) {
			// ajax request failed
			trace("e:request:AJAX call failed");
			this.confirm({
				message:	"Your session may have expired. Please confirm to reload the page now, or cancel to stay in the current state.",
				title:		"Operation Failure",
				confirm:	function(e){
					location.href = location.href; 
				},
				cancel:		function(e){
					_client.trace("w.request.bad-ending");
				}
			});
		}
	};
	/* Extend (oevrride) properties */
	if (typeof set_jquery_ajax_options == "object") {
		jQuery.extend(jquery_ajax_options, set_jquery_ajax_options);
	}
	else if (typeof set_jquery_ajax_options === 'string'){
		jquery_ajax_options.data = {request: set_jquery_ajax_options};
	}
	else {
		trace("e:request.type-error");
		return false;
	}
	// Include this.client_ext in request data, to tell server who am I. Then fire AJAX request. 
	if (typeof jquery_ajax_options.data == 'object') {
		jquery_ajax_options.data.client_ext = this.client_ext;
		jQuery.ajax(jquery_ajax_options);
	}
	else if (typeof jquery_ajax_options.data == 'string') {
		jquery_ajax_options.data += "&client_ext=" + this.client_ext;
		jQuery.ajax(jquery_ajax_options);
	}
	else {
		this.trace("e.request: data must be object of string.");
	}
};

hive.client.prototype.requestSuccess = function(response)
{
	this.debug = true;
	// TODO move
	this.$root.find('.form-group').removeClass('has-error');
	
	this.response = response;
	
	// That's all
	if ('redirect' in response && response.redirect) {
		this.trace('requestSuccess > redirect');
		return this.processRedirect(response.redirect);
	}
	// CSRF Token Refresh
	if ('csrf' in response) {
		this.trace('requestSuccess > csrf');
		this.processCSRF(response.csrf);
	}
	// Notifications
	if ('notifications' in response) {
		this.trace('requestSuccess > notifications');
		this.processNotifications(response.notifications);
	}
	// Alerts
	if ('alerts' in response) {
		this.trace('requestSuccess > alerts');
		this.processAlerts(response.alerts);
	}
	// Validation Errors
	if ('validationErrors' in response) {
		this.trace('requestSuccess > validationErrors');
		this.processValidationErrors(response.validationErrors);
	}
	// Evil call the handler method after standard procedures
	if ('handler' in response && response.handler) {
		this.trace('requestSuccess > handler: ' + response.handler);
		var responseHandler = response.handler.replace(/\-/,'_');
		if (responseHandler in this) {
			this.trace('responseSuccess.call-handler-now');
			eval("this." + responseHandler + "(_client.response);");
		}
		else {
			this.trace("requestSuccess: handler-not-exists " + responseHandler);
		}
	}
	else {
		this.trace("requestSuccess.handler-not-returned");
	}
};
hive.client.prototype.processAlerts = function(alerts)
{
	var _this = this;
	$.each(alerts, function(key, alert) {
		
		_this.alert(alert.message, alert.title);
		
	});
};
/**
 *	Process Notifications Returned from Request
 */
hive.client.prototype.processNotifications = function(notifications)
{
	// To be migrated to slimcore.js
};


/**
 *	An Array of Helpers\Form\validationErrors object.
 */
hive.client.prototype.processValidationErrors = function(validationErrors)
{
	_this = this;
	$.each(validationErrors, function(i, ve) {
		_this.trace('processValidationErrors.1');
		$form = $("form#" + ve.formId);
		if ($form.length == 0) {
			_this.trace('processValidationErrors.2');
			_this.trace('processValidationErrors.form-absent');
		}
		
		// Clear previous style
		$form.find("input").removeClass('error');
		// Rock
		var $msgBody = $("<div>").append($("<p>", {text: 'message' in ve ? ve.message : "We could not validate your input, please change it and submit again."}));
		if (typeof ve.errorFields == 'object' && ve.errorFields != null) {
			_this.trace('processValidationErrors.5');
			var $ul = $("<ul>");
			$.each(ve.errorFields, function(j, ef){
				if ('error' in ef) {
					$ul.append($("<li>", {text: ef.error}));
				}
				if ('field' in ef) {
					//_this.trace('processValidationErrors.invalid:' + ef.field);
					// Validation State Style, BS3
					$form.find("*[name='" + ef.field +  "']").closest('.form-group').addClass('has-error');
				}
			});
			$msgBody.append($ul);
		}
		if ('help' in ve) {
			$msgBody.append($("<p>", {text: ve.help}));
		}
		// Roll
		_this.alert({
			title: "Invalid input",
			message: $msgBody
		});
	});
};
hive.client.prototype.processCSRF = function(csrf)
{
	var _this = this;
	if ('csrf_token' in csrf && csrf.csrf_token) {
		if ('csrf_name_key' in csrf) {
			// Refresh the CSRF token for the form with submitted token, or all forms if no token has returned.
			var $csrf_input = ('csrf_name_value' in csrf && csrf.csrf_name_value)
				? $("input[name='"+ csrf.csrf_name_key +"'][value='" + csrf.csrf_name_value + "']")
				: $("input[name='"+ csrf.csrf_name_key +"']");
			// Iterate matching token input and update it's parent form.
			if ($csrf_input.length) { 
				$.each($csrf_input, function(key, el){
					$form = $(el).closest('form');
					$.each(csrf.csrf_token, function(key, val){
						_this.trace('CSRF: ' + key + ":" + val);
						_this.trace($form.find("input[name='" + key + "']"));
						$form.find("input[name='" + key + "']").val(val);
					});
					_this.trace('processCSRF.csrf-token-refreshed');
				});
			}
			else {
				this.trace('processCSRF.no-matching-input-tag');
			}
		}
		else {
			this.trace('e.processCSRF.missing:csrf.csrf_name_key');
		}
	}
	else {
		this.trace('e.processCSRF.missing:csrf.csrf_token');
	}
};
hive.client.prototype.processRedirect = function(redirect)
{
	this.trace("processRedirect()");
	if ('url' in redirect) {
		if ('delay' in redirect) {
			// this.trace("redirect.delay:" + redirect.delay);
			setTimeout(function(){
				// _client.trace(redirect.url);
				location.href = redirect.url;
			}, redirect.delay);
		}
		else {
			// _client.trace(redirect.url);
			location.href = redirect.url;
		}
	}
	return true;
};
hive.client.prototype.processJqueries = function(response)
{
	console.log(2);
	this.trace("processJqueries()");	
};
hive.client.prototype.processForm = function(response)
{
	console.log(2);
	this.trace("processForm()");
};
hive.client.prototype.processData = function(response)
{
	console.log(2);
	this.trace("processData()");
};







// TODO MOVE TO request_callback()...
hive.client.prototype._handle_response = function(response)
{
	// Validate response
	if (typeof response.status == 'boolean'){
		// Switch on debug
		if (typeof response.logs != 'undefined' && !this.debug) {
			this.debug = true;
			this.trace('Hive.Client ' + this.client_ver +' with jQuery ' + $().jquery, 'warn');
		}
		// Standard success
		if (response.status){
			this.trace("request.responsed.success");
		}
		else{
			this.trace("request.responsed.failure");
		}
		// Notices
		if ('notices' in response){
			this.trace("request.responsed.notices");
			this._process_notices(response.notices);
		}
		// Errors
		if ('errors' in response){
			this.trace("request.responsed.errors");
			this._process_errors(response.errors);
		}
		return true; // Handled
	}
	else {
		// invalid response
		this.trace("request.responsed.invalid");
	}
	return false; // Not handled
};
// Standard client for Hive._notice()
hive.client.prototype._process_notices = function(notices)
{
	$.each(notices, function(key, notice){
		_client.alert({
			title:	(typeof notice == 'object' && 'title' in notice) ? notice.title : "Notice",
			body:	(typeof notice == 'object' && 'body'  in notice) ? notice.body  : (typeof notice == 'string' ? notice : "(empty)")
		});
	});
};
// Standard client for Hive._error()
hive.client.prototype._process_errors = function(errors)
{
	var _this = this;
	if (typeof errors == 'object'){
		$.each(errors, function(i, error){
			if ('type' in error) {
				switch (error.type) {
					case 'generic':
						_this.alert({title: "Error", body: error.message});
						break;
					case 'permission':
						_this.alert({title: "Access Denied", body: error.message});
						break;
					case 'validation':
						_this.trace("_handle_response_errors.std-error.validation");
						var $body = $("<div>").append($("<p>", {text: 'message' in error ? error.message : "We could not validate your input, please change it and submit again."}));
						if ('errors' in error) {
							var $ul = $("<ul>");
							$.each(error.errors, function(j, ve){ // ve = validation error
								if (typeof ve == 'object') {
									if ('message' in ve) {
										$ul.append($("<li>", {text: ve.message}));
									}
									if ('field' in ve) {
										console.warn("Error field: " + ve.field);
									}
								}
								else if (typeof ve == 'string') {
									$ul.append($("<li>", {text: ve}));
								}
							});
							$body.append($ul);
						}
						_this.alert({
							title: "Invalid input",
							message: $body
						});
						break;
					default:
						_this.trace("_handle_response_errors.std-error.type-not-recognized:ignored");
				}
			}
			else {
				_this.trace("_handle_response_errors.non-std-error:ignored");
			}
		});
	}
};
// Sample
hive.client.prototype.request_automated = function(e)
{
	var $this = jQuery(e.currentTarget);
	var root = jQuery(this.root);
	if ($this.size()){
		// Required data
		var request = $this.data("request");
		if (typeof request === 'string' && request.length > 0){
			switch (request){
				// Some request
				case "do_something":
					this.trace("I'll doing something.");
					break;
				default:
					this.trace("m:request_automated.no-custom-handler:" + request);
					return null; // I did nothing.
			}
			return true; // I did something. 
		}
	}
	else {
		return null; // I don't exists.
	}
};
hive.client.prototype.request_callback = function(response, request_callback_once)
{
	
	
	
 	trace("request_callback_legacy()");
 	
 	if (typeof response.debug == 'boolean' && response.debug) {
 		console.warn("Debug data returned.");
 		console.info(response.data);
 		return true;
 	}
 	
 	/* Session Timeout */
	if (this.authenticated && !(typeof response.authenticated == 'boolean' && response.authenticated)){
		this.authenticated = false;
		location.href = this.url_home;
		console.log("-_-");
	}
	else {
		// Valid response should have an request:String
		if (typeof response.request === 'string'){
			// Store valid response
			this.response = response;
			// Update Login Status
			if (typeof response.authenticated == 'boolean') this.authenticated = response.authenticated;
			// Redirect to URL
			if ('client_redirect' in response && typeof response.client_redirect == 'string') {
				location.href = response.client_redirect;
				return true;
			}
			// Refresh Token
			if (response.token) {
				var $_ = $("input[name='request'][value='" + response.request + "']");
				if ($_.size()) {
					$_.siblings("input[name='token']").val(response.token);
					this.trace($_.siblings("input[name='token']").val());
				}
			}
			
			// $("#frm-orientation-reg INPUT[name='token']").val(response.token);
			
			/* Update Meta Arrays */
			if (typeof response.meta === 'object'){
				this.meta = response.meta;
			}

			// Collect Standard Objects: meta, roles, etc.
			this.meta = typeof response.meta === 'object' ? response.meta : this.meta;
			
			/* Hive UI Buffer */
			if (typeof response.ui_buffer === 'string'){
				jQuery(this.buffer).append(response.ui_buffer);
			}
			
			/* Hive Auto UI */
			if (this.ui_auto && typeof response.ui == "string"){
				var ucontainer = (typeof response.ui_container === 'string') ? jQuery("#" + response.ui_container) : jQuery(this.root);
				ucontainer.hide().html(response.ui);
				this.ui_build();
				//this.build_ui();
				//trace(_root.html());
			}
			
			/* Execute jQuery Actions */
			if (typeof response.jqueries === 'object'){
				this._process_jqueries(response.jqueries);
			}
			
			
			/* Show error/message
			if (typeof response.error === 'string' && response.error.length > 0){
				this.request_(response.error, 'Error');
				this.alert(response.error, 'Error');
			}
			else if (typeof response.message === 'string' && response.message.length > 0){
				this.alert(response.message, 'Message');
			}
			 */
			
			// Admin Response Handler
	 		if (response.request.match(/^admin[-_]/) && typeof this.request_callback_admin === 'function'){
	 			/* Held if request_callback_admin() return true */
	 			if (this.request_callback_admin(response)){
	 				return true;
	 			}
	 			trace("m:request_callback():continued");
	 		}
	 		/* Standard Response Handler */
	 		else {
				switch (response.request){
					case 'init':
						/* Authentication after init? */
						if (this.start_auth){
							if (typeof response.authenticated == 'boolean' && response.authenticated){
								this.authenticated = true;
								jQuery(".widget-logout").show();
							}
							else {
								this.login_init();
							}
						}
						else{
							trace("m:init-start-auth-disabled");
						}
						break;
					case 'login':
						if (typeof response.authenticated == 'boolean' && response.authenticated){
							this.authenticated = true;
							jQuery(".widget-logout").show();
							/* Resend start-up request after authentication */
							if (typeof INIT_REQUEST !== 'undefined'){ // Backward Compatibility
								trace("w:old-feature-need-to-be-updated");
								this.request(INIT_REQUEST);
							}
							else if (typeof this.start_request !== 'undefined'){
								trace("m:now-resend-start-request");
								this.request(this.start_request);
							}
						}
						else {
							this.login_init("Invalid Library No. or PIN, please try again.");
						}
						break;
				}
			}

			
			/* Auto process of data in standard format *\ 
			\*	e.g. [{dataset: 'name1', records: assoc_array(...), target: '#jq-table-selector'}, {dataset: 'name2'...] */
			if ("data" in response) {
				this._process_data(response.data);
			}
			
			/* Callback function from parameter */
			if (typeof request_callback_once === 'function') {
				request_callback_once(response);
			}
			else {
				/* App-defined callback functions (support up to 3 execution levels) */
				if (typeof this.request_callback_extended   === 'function') this.request_callback_extended(response);
				if (typeof this.request_callback_extended_1 === 'function') this.request_callback_extended_1(response);
				if (typeof this.request_callback_extended_2 === 'function') this.request_callback_extended_2(response);
				
				
				// Evil
				if ('handler' in response) {
					var responseHandler = response.handler.replace(/\-/,'_');
					if (responseHandler in this) {
						eval("this." + responseHandler + "(_client.response);");
					}
				}
				else {
					trace("response.handler not found");
				}
				
			}

			/* **************************************************** */
			/* All HTML manipulation should done before this block! */
			/* **************************************************** */
			
			/* Construct UI and Widgets */
			//this.build_ui();
			
			/* Show if UI returned */
			if (this.ui_auto && typeof response.ui === "string"){
				ucontainer.show();
			}
			
			/* Get additional script for authentcated users.
			if (!this.user_script && this.authenticated){
				this.user_script = true;
				this.request("user_script", false, false, "script");
			}
			 */
			
			/* Execute Queued Request (as told by HiveServer) */
			if (typeof response.request_queue === 'object' && typeof response.request_queue.data === 'object'){
				trace('m:request_callback:request_queue');
				this.request(
					response.request_queue.data,
					(typeof response.request_queue.url === 'string' ? response.request_queue.url : undefined),
					(typeof response.request_queue.type === 'string' ? response.request_queue.type : undefined),
					(typeof response.request_queue.dataType === 'string' ? response.request_queue.dataType : undefined)
				);
			}
		}
		else {
			trace('Invalid request responsed.');
		}
	}
};

hive.client.prototype.request_callback_flag_handler = function (response)
{
	if (response.flag.match(/--load-script/) && typeof response.load_script === 'string'){
		jQuery.ajax({
			url:		response.load_script,
			dataType:	"script",
			success:	function(){
				trace("m:load-script:sussess");
				// if (typeof _client.admin_init === 'function'){
					// _client.admin_init();
				// }
			}
		});
	}
};

// BETA, require 3.1.jq.js
hive.client.prototype._process_data = function(data)
{
	if (typeof data == 'object') {
		$.each(data, function(recordset, data){
			var handler = 'handler' in data ? data.handler : 'default';
			//_client.trace("_process_data:" + data.recordset + "." + handler);
			switch (handler) {
				case 'custom':
					// Handle by request callback method. 
					break;
				case 'form':
					$(data.selector).formFill(data.records[0]);
					break;
				case 'records':
					_client._process_data_records(data);						
					break;
				case 'presentation':
					_client._process_data_presentation(data);
					break;
				case 'propagate':
					_client._process_data_propagate(data);						
					break;
				case 'auto':
				case 'default':
				default:
					// jQuery target selector found
					if (data.selector) {
						var $el = $(data.selector);
						
						if ($el.length){
							//_client.trace("_process_data.target.length:" + $target.length);
							$el.each(function(key, target){
								$(target).uc_spawn({records: data.records});
							});
						}
					}
			}
		});
	}
};
hive.client.prototype._process_data_propagate = function(data)
{
	this.trace("_process_data_propagate.selector:" + data.selector);
	var $el = $(data.selector);
	
	if ($el.length){
		if(data.records.length > 0) {
			$el.find('.records-not-found, .record-not-found').hide();
			$el.each(function(key, target){
				_client.trace($(target));
				
				var $container = $(target).find('.records-found');
				
				console.info($container);
				console.info(data.records);
				
				$container.uc_spawn({records: data.records});
				$container.show();
			});
		}
		else {
			$targets.find('.records-found, .record-found').hide();
			$targets.find('.records-not-found, .record-not-found').show();
		}
	}
};
hive.client.prototype._process_data_records = function(data)
{
	if (data.selector){
		var $targets = $(data.selector);
		if ($targets.length){
			if(data.records.length > 0) {
				$targets.find('.records-not-found, .record-not-found').hide();
				$targets.each(function(key, target){
					var $container = $(target).find('.records-found');
					$container.uc_spawn({records: data.records});
					$container.removeClass("hidden").show();
				});
			}
			else {
				$targets.find('.records-found, .record-found').hide();
				$targets.find('.records-not-found, .record-not-found').show();
			}
		}
	}
};

// Single record prenstation 
hive.client.prototype._process_data_presentation = function(data)
{
	_client.trace("_process_data_presentation()");
	var $el = $(data.selector);
	if ($el.length){
		if(data.records.length == 1 && data.records[0] != null && typeof data.records[0] == 'object') { // Single Record!
			$el.each(function(key, target){
				$container = $(target);
				$.each(data.records[0], function (prop, val) {
					$fields = $container.find('*[data-field="' + prop + '"]');
					val = val == null ? '' : val;
					if ($fields.size()){
						$fields.each(function(){
							if (jQuery(this).prop('tagName').match(/TEXTAREA|INPUT/i)){
								if (jQuery(this).prop('type').match(/checkbox/i)) {
									jQuery(this).prop("checked", (val == 1 || val == "on"));
								}
								else {
									jQuery(this).val(val);
								}
							}
							else if (prop in data.html_fields) {
								jQuery(this).html(val);
							}
							else {
								jQuery(this).text(val);
							}
						});
					}
				});
			});
		}
		else {
			_client.trace("_process_data_presentation:requires-single-record");
		}
	}
};


// Single record prenstation 
hive.client.prototype._process_forms = function(form)
{
	//this.trace("_process_data_presentation()");
	if (dataset.target){
		var $targets = $(dataset.target);
		if ($targets.length){
			if(dataset.records.length == 1 && dataset.records[0] != null && typeof dataset.records[0] == 'object') { // Single Record!
				$targets.each(function(key, target){
					$container = $(target);
					$.each(dataset.records[0], function (prop, val) {
						$fields = $container.find('*[data-field="' + prop + '"]');
						val = val == null ? '' : val;
						if ($fields.size()){
							$fields.each(function(){
								if (jQuery(this).prop('tagName').match(/TEXTAREA|INPUT/i)){
									if (jQuery(this).prop('type').match(/checkbox/i)) {
										jQuery(this).prop("checked", (val == 1 || val == "on"));
									}
									else {
										jQuery(this).val(val);
									}
								}
								else if (prop in dataset.html_fields) {
									jQuery(this).html(val);
								}
								else {
									jQuery(this).text(val);
								}
							});
						}
					});
				});
			}
			else {
				_client.trace("_process_data_presentation:requires-single-record");
			}
		}
	}
};

// BS3 Edition
hive.client.prototype.ui_build = function()
{
	this.trace("hive.client.ui_build()");

	var $root = jQuery(this.root);
	
	// Move BS Modals, and NavBar under <body>
	jQuery(this.root).find(".uc-bs-modals .modal, nav.navbar").appendTo("body");
	// Move BS NavBar under <body>
	

	// BS Multiple Modals (http://stackoverflow.com/questions/19305821/multiple-modals-overlay)
	jQuery(document).on('shown.bs.modal', '.modal', function() {
		var zIndex = 1040 + (10 * jQuery('.modal:visible').length);
		_client.trace("uc3.patch.bs3:shown.bs.modal:" + $(this).prop("id") + "/z-index:" + zIndex);
		jQuery(this).css('z-index', zIndex);
		setTimeout(function() {
			jQuery('.modal-backdrop').not('.modal-stack:first').css('z-index', zIndex - 1).addClass('modal-stack');
		}, 0);
	});
	
	// Run Once
	if (!jQuery("#modal-uc-form-submit").data("init")){
		jQuery("#modal-uc-form-submit").data("init", true);
		jQuery("#modal-uc-form-submit").on("shown.bs.modal", function(e){
			jQuery(this).find(".auto-focus").focus();
		});
	}
	
	jQuery("body").delegate(".uc-form-submit", "click", function(e){
		_client.trace(".uc-form-submit.click()");
		// Look for selector in data-target attr...
		var $form = jQuery(jQuery(this).data("target"));
		// No form? try closest form
		if ($form.size() === 0)
			$form = jQuery(this).closest("form");
		// Submit if exists
		if ($form.size() === 1)
			_client.request({data: $form.serialize()});
	});

	// Modal Form
	this.ui_build_modal_form();

	// Standard Form Submission
	jQuery("body").delegate(".uc-modal-form .uc-modal-submit-form", "click", function(e){
		var $form = jQuery(this).closest(".modal").find("form");
		if ($form.size() === 1){
			_client.trace("m:uc-modal-submit-form");
			$form.submit();
		}
		else {
			_client.trace("e:uc-modal-submit-form:no-form");
		}
	});


	// Build in functions
	jQuery("body").delegate(".uc-checkbox-container", "click", function(e){
		if (!$(e.target).prop("tagName").match(/INPUT|LABEL/i)) {
			$el = jQuery(e.currentTarget).find("input[type='radio'], input[type='checkbox']");
			if (!$el.prop("disabled")){
				$el.prop("checked", !$el.prop("checked"));
			}
		}
	});
	jQuery("body").delegate(".uc-toggle-check-all", "click", function(e){
		var $target = $($(e.currentTarget).data("target"));
		if ($target.length) {
			$target.find("input[type='checkbox']").prop("checked", $(e.currentTarget).prop("checked"));
		}
	});

	// Standard Controls
	$("body").delegate(".uc-logout", "click", function(e){
		_client.logout();
	});
	
	// Alert message fade in after 0.5 sec
	setTimeout(function(){_client.$root.find(".main-content > .alert.fade").addClass("in");}, 500);
	
	return true;
};

hive.client.prototype.ui_build_modal_form = function()
{
	// AJAX Request 
	jQuery("body").delegate(".uc-modal-form .uc-modal-submit", "click", function(e){
		_client.trace("uc-modal-submit()");
		//e.preventDefault();
		var $form = jQuery(this).closest(".modal").find("form");
		if ($form.size() === 1){
			// HTML5 Constrain Validation
			if ($form[0].checkValidity()){
				
				
		    	// Customized Validation
		    	if (DEBUG && typeof _client.form_validate == 'function'){
		    		if (_client.form_validate($form)){
						_client.request({data: $form.serialize()});		    			
		    		}
		    		else {
		    			e.preventDefault();
		    		}
		    	}
				// Submit with std UC3 request method
				
			}
			else {
		    	// Customized Validation
		    	if (DEBUG && typeof _client.form_validate == 'function'){
		    		_client.form_validate($form);
		    	}
				
				var afterFocus = false;
				// TODO Need beter handling
				$form.find('input:visible').each(function()
				{
				    if(!this.validity.valid){
				    	//jQuery(this).focus();
				    	afterFocus = afterFocus ? afterFocus : this;
				    	_client.trace(this.validationMessage);
				    }
				    else {
				    	// Remove popover for valid filed
				    	jQuery(this).popover('destroy');	
				    }
				});
				// Focus the first invalid elements
				if (afterFocus){
					//this.validationMessage;
					trace(jQuery(afterFocus));
					jQuery(afterFocus).popover({
						content: afterFocus.validationMessage,
						placement: "bottom"
					}).popover('show');
					afterFocus.focus();
				}
				_client.trace("e:uc-modal-submit:client-validation-failure");
			}
			//_client.request({data: $form.serialize()});
		}
		else {
			_client.trace("e:uc-modal-submit:no-form");
		}
	});
};

hive.client.prototype._view_requires_init = function(view)
{
	view = typeof view == 'undefined' ? $(this.root).data("view") : view; 
	return (
		typeof view == 'string' && view.match(/^[a-z_]*[a-z0-9_]*$/i) && !view.match(/^login$|^logout$/i)
	);
};

/* jQuery calls
 * 
 * (PHP) $jqueries = 
 * 	array(
 * 		array("selector" => "body > div#box1", "method" => "append", "<p>New paragraph.</p>"),
 * 		array("selector" => "#main .footer", "method" => "css", "property" => "font-family", "value" => "Comic Sans"),
 * )
 */
hive.client.prototype._process_jqueries = function(jqueries)
{
	this.trace("_process_jqueries()");
	if (typeof jqueries === 'object'){
		var _this = this;
		var $root = jQuery(this.root);
		jQuery.each(jqueries, function(idx, jq){
			// Where
			$target = (typeof jq.selector === 'string') ? jQuery(jq.selector) : $root;
			// How
			switch (jq.method){
				case "addClass":
					$target.addClass(jq.data); break;
				case "after":
					$target.after(jq.data); break;
				case "append":
					$target.append(ui.data); break;
				case "before":
					$target.before(jq.data); break;
				case "html":
					$target.html(jq.data); break;
				case "prepend":
					$target.prepend(jq.data); break;
				case "prop":
					$target.prop(jq.property, ui.value); break;
				case "removeClass":
					$target.removeClass(jq.data); break;
				case "text":
					$target.text(jq.data); break;
				case "css":
					$target.css(jq.property, ui.value); break;
				case "val":
					$target.val(jq.data); break;
				default:
					_this.trace("ui_auto.method-not-supported:" + jq.method);
			}
		});
	}
	else {
		_this.trace("ui_auto.type-error:expected-object:given-" + (typeof ui_objects));
	}
};

hive.client.prototype.message = function(message_or_options, title)
{
	return this.alert(message_or_options, title);
};

hive.client.prototype.alert = function(message_or_options, title)
{
	var options = {
		title:		"Notice",
		body:		undefined,			// jQuery Object
		focusAfter:	undefined,	// TODO to implement
	};
	// Options Object
	if (typeof message_or_options === 'object'){
		jQuery.extend(options, message_or_options);
	}
	// Message String
	else if (typeof message_or_options === 'string'){
		options.body = message_or_options;
	}
	// Optional
	if (typeof title === 'string'){
		options.title = title;
	}
	// Backward
	if (!options.body && 'message' in options) {
		options.body = options.message;
	}
	// We need a jQuery object of modal-body  
	if (typeof options.body === 'string' && options.body.length > 0){
		options.body = $("<p>", {text: options.body});
	}
	// Show model if it is a jQuery object
	if (typeof options.body == 'object' && options.body.jquery) {
		var $modal = jQuery("#uc-modal-alert");
		if ($modal.size()){
			$modal.find(".modal-title").text(options.title);
			$modal.find(".modal-body").empty().append(options.body);
			$modal.modal("show");
		}
	}
};

hive.client.prototype.alert_validation_errors = function(error_desc, validation_errors)
{
	trace(error_desc);
	var $container = jQuery("<div>");
	
	// The error description
	$container.append(jQuery("<p>", {text: error_desc}));
	
	// Detailed validation errors
	if (typeof validation_errors == 'object' && validation_errors.length > 0) {
		var $err_ul = jQuery("<ul>");
		jQuery.each(validation_errors, function(key, err){
			$err_ul.append(jQuery("<li>", {text: err.desc}));
		});
		$container.append($err_ul);
	}
	this.alert({
		title: "Invalid input",
		message: $container.html()
	});
};

// Rev.161118
hive.client.prototype.confirm = function(set_options, title, func_confirm, func_cancel)
{	// Default
	var options = {
			message:		"Confirm?",
			title:			"Confirmation",
			confirm:		function() {},
			cancel:			function() {},
			confirm_caption:"Yes",
			cancel_caption:	"No"
		};
	// Param
	if (typeof set_options == 'object'){
		jQuery.extend(options, set_options);
	}
	// Backward compatibility
	else {
		this.trace("w:confirm.legacy-code-detected");
		options = {
			message:	(typeof set_options == 'string' ? set_options: options.message),
			title:		(typeof title == 'string' ? title: options.title),
			confirm:	(typeof func_confirm == 'function' ? func_confirm: options.confirm),
			cancel:		(typeof func_cancel == 'function' ? func_cancel: options.cancel),
		};
	}
	// Wrap plain text in <p>. 
	options.message = options.message.match(/<.*>/) ? options.message : ("<p>" + options.message + "</p>");
	// Prepare and show the modal dialog
	var $modal = jQuery("#uc-modal-confirm");
	if ($modal.size() == 0){
		// TODO to create the modal on the fly
	}
	// Cosmatic
	$modal.find(".modal-title").text(options.title);
	$modal.find(".modal-body").html(options.message);
	$modal.find(".uc-btn-confirm").text(options.confirm_caption);
	$modal.find(".uc-btn-cancel").text(options.cancel_caption);
	$modal.data("confirmed", false);
	// Confirm
	$modal.find(".uc-btn-confirm").on("click", options.confirm);
	$modal.find(".uc-btn-confirm").on("click", function(){
		$modal.unbind("hide.bs.modal"); // Prevent calling of options.cancel
	});
	// Cancel (bind on modal hide)
	$modal.on("hide.bs.modal", options.cancel); 
	$modal.find(".uc-btn-cancel").on("click", function(){$modal.modal("hide");});
	// Unbind event 
	$modal.on("hidden.bs.modal", function(){
		//console.info("confirmation.closed");
		jQuery(this).find(".uc-btn-confirm").unbind("click");
		jQuery(this).find(".uc-btn-cancel").unbind("click");
		jQuery(this).unbind("hide.bs.modal hidden.bs.modal");
		//console.info("confirmation.events.unbound");
	});
	// Prompt
	$modal.modal("show");
};

// Updated elements with data binded
hive.client.prototype.data_update = function(parent_selector, data, html_fields)
{
	// Defaulf empty object
	html_fields = typeof html_fields == 'object' ? html_fields : {};
	var $parents = jQuery(parent_selector);
	if ($parents.size()){
		$parents.each(function(){
			$parent = jQuery(this);
			jQuery.each(data, function(prop, val){
				$fields = $parent.find('*[data-field="' + prop + '"]');
				if ($fields.size()){
					$fields.each(function(){
						// switch (jQuery(this).prop('tagName').toUpperCase()){
							// case "TEXTAREA":
							// caee ""
						// }
						// Fill data based on Tag Name
						var tagName = jQuery(this).prop('tagName');
						if (tagName.match(/^TEXTAREA$|^INPUT$/i)){
							//_client.trace("1: " + tagName + " / " + jQuery(this).data('field'));
							if (jQuery(this).prop("type") == "checkbox") {
								val = (val == "on" || val == "1" || val == 1) ? true : false; 
								jQuery(this).prop("checked", val);
							}
							else {
								jQuery(this).val(val);
							}
						}
						else if (tagName === "A"){
							//_client.trace("2: " + tagName + " / " + jQuery(this).data('field'));
							jQuery(this).prop("href", val);
						}
						else if (prop in html_fields) {
							//_client.trace("3: " + tagName + " / "  + jQuery(this).data('field'));
							jQuery(this).html(val);
						}
						else {
							//_client.trace("4: " + tagName + " / "  + jQuery(this).data('field'));
							jQuery(this).text(val);
						}
					});
				}
			});
		});
	}
	else {
		trace("w.dom_global_update.element-not-found:" + parent_selector);
	}
};
// Updated elements with data binded
hive.client.prototype.data_fill_table = function(parent_selector, data, html_fields)
{
	// Defaulf empty object
	html_fields = typeof html_fields == 'object' ? html_fields : {};
	var $parents = jQuery(parent_selector);
	if ($parents.size()){
		$parents.each(function(){
			$parent = jQuery(this);
			jQuery.each(data, function(prop, val){
				$fields = $parent.find('*[data-field="' + prop + '"]');
				if ($fields.size()){
					$fields.each(function(){
						if (jQuery(this).prop('tagName').match(/TEXTAREA|INPUT/i)){
							jQuery(this).val(val);
						}
						else if (prop in html_fields) {
							jQuery(this).html(val);
						}
						else {
							jQuery(this).text(val);
						}
					});
				}
			});
		});
	}
	else {
		trace("w.dom_global_update.element-not-found:" + parent_selector);
	}
};

/* Console Trace */
hive.client.prototype.trace = function trace(msg, msgType, forceDisplay)
{
	forceDisplay = typeof forceDisplay == 'boolean' ? forceDisplay : false;
	if ((typeof this.debug == 'boolean' && this.debug) || forceDisplay){
		try{
			if (console){
				msgType = typeof msgType === 'string' ? msgType : 'log';
				switch (msgType.toLowerCase()){
					case 'information':
					case "info":
					case 'i':
						if(console.info) console.info(msg);
						else if(console.log) console.log(msg);
						break;
					case 'warning':
					case "warn":
					case 'w':
						if(console.warn) console.warn(msg);
						else if(console.log) console.log(msg);
						break;
					case "error":
					case 'err':
					case 'e':
						if(console.error) console.error(msg);
						else if(console.warn) console.warn(msg);
						else if(console.log) console.log(msg);
						break;
					case "log":
					default:
						if(console.log) console.log(msg);
				}
			}
			else {
				// no console :( 
			}
		}
		catch(e_trace){
			if (this.debug_trace_fallback_alert){
				alert(msg);
			}
		}
	}
	/* Save to a global window._UC_LOGS for analysis, export, etc... */
	if (this.debug_trace_history_limit > 0){
		if (typeof _UC_LOGS == 'undefined') window._UC_LOGS = new Array();
		if (_UC_LOGS.length > this.debug_trace_history_limit) _UC_LOGS.shift();
		_UC_LOGS.push(msg);
	}
};

// Backward compatibility
function trace(msg, msgType, forceDisplay)
{
	hive.client.prototype.trace(msg, msgType, forceDisplay);
}

/* Search for "__PROPERTY__" in "search" string and replace with replace.PROPERTY value.*/
hive.client.prototype.strprep = function(search, replace)
{
	if (typeof search === 'string' &&  typeof replace === 'object'){
		jQuery.each(replace, function(field, value){
			var pattern = new RegExp("__" + field + "__", "gi");
			value = value == null ? "" : value;
			search = search.replace(pattern, value);
		});
		return search;
	}
	else if (typeof search === 'string'){
		return search;
	}
	else {
		return false;
	}
};

/* strprep() with special handling of patron record with multiple emails, which adds a space after the comma for correct word wrapping. */
hive.client.prototype.strprepA = function(search, replace)
{
	if (typeof search === 'string' &&  typeof replace === 'object'){
		jQuery.each(replace, function(field, value){
			if (field == 'pmail'){
				value = value.replace(/,/, ", ");
			}
			var pattern = new RegExp("__" + field + "__", "gi");
			value = value == null ? "" : value;
			search = search.replace(pattern, value);
		});
		return search;
	}
	else if (typeof search === 'string'){
		return search;
	}
	else {
		return false;
	}
};

/* Tranform give records (array of objects) HTML, template will be preped with hive strprep(). */
hive.client.prototype.records_to_html = function(template, records)
{
	var _this = this;
	var html = "";
	if (typeof template === 'string'){
		if (typeof records === 'object' && records.length > 0){
			jQuery(records).each(function(index, record){
				html+= _this.strprepA(template, record);
			});
		}
		else {
			_this.trace("w:records_to_html:records-not-found");
		}
	}
	else{
		_this.trace("w:records_to_html:template-is-not-string");
	}
	return html;
};

/* Tranform give records (array of objects) HTML, template will be preped with hive strprep(). */
hive.client.prototype.logout = function()
{
	location.href = './?logout';
};

// BETA, require 3.1.jq.js
hive.client.prototype.response_process_data = function()
{
	if (typeof this.response == 'object' && 'vesion' in this.response && 'data' in this.response) {
		if (this.response.version <= 3.1) {
			console.log(this.response.data);
		}
	}
	if (typeof data == 'object') {
		$.each(data, function(datasetname, dataset){
			var handler = 'handler' in dataset ? dataset.handler : 'default';
			//_client.trace("_process_data:" + datasetname + "." + dataset.handler);
			switch (handler) {
				case 'form':
					$(dataset.target).formFill(dataset.records[0]);
					break;
				case 'records':
					_client._process_data_records(dataset);						
					break;
				case 'presentation':
					_client._process_data_presentation(dataset);
					break;
				case 'default':
				default:
					// jQuery target selector found
					if (dataset.target){
						var $targets = $(dataset.target);
						if ($targets.length){
							//_client.trace("_process_data.target.length:" + $target.length);
							$targets.each(function(key, target){
								$(target).uc_spawn({records: dataset.records});
							});
						}
					}
			}
		});
	}
};
