(function () {

	var FU = function (config) {

		this.config = {
			selector: null,
			ajax_src: null,
			extensions: 'jpg|jpeg|png|gif',
			has_main: false,
			has_rotation: true,
			max_upload: 50,
			base_url: '',
			post_file_index: 'img_index',
			post_file_name: 'img_name',
			post_file_rotate: 'img_rotate',
			on_init: null,
			on_upload: null,
			on_error: null,
			on_delete: null,
			on_rotate: null,
			on_drop: null,
			predefined_images: []
		};

		$.extend(this.config, config);

		if (!this.config.selector || !this.config.ajax_src) {
			alert('Required parameters are not available!');
			return;
		}

		if (!window.file_upload_instense) {
			window.file_upload_instense = 0;
		}

		window.file_upload_instense++;

		this.container = 'imgPrev' + file_upload_instense;

		this.instense = file_upload_instense;

		if (this.config.has_main && this.config.has_main == true) {
			$('head').append("<style>#" + this.container + " .imgbox:first-child:after {content: 'Main Picture';background: #337ab7;color: #fff;padding: 0 3px;position: absolute;top: 0;left: 0;border-top-left-radius: 4px;border-bottom-right-radius: 4px;}</style>");
		}

		this.allowed_extensions = [];
		this.allowed_extensions_icons = {};
		this.files_count = 0;

		this.set_extensions();

		var multiple_files = (this.config.max_upload > 1) ? 'multiple' : '';

		var rotate_class = (this.config.has_rotation) ? 'has_rotate' : '';

		var h = '<button type="button" class="btn btn-primary select_files_btn">\
		Select Files\
		<input type="file" name="hidden_file_input' + file_upload_instense + '" class="hidden_file_input" id="hidden_file_input' + file_upload_instense + '" ' + multiple_files + '>\
		</button>\
		<div id="' + this.container + '" class="fu-imgPrev ' + rotate_class + '"></div>';


		$(this.config.selector).html(h);

		if (this.config.predefined_images && this.config.predefined_images.length > 0) {

			this.files_count = this.config.predefined_images.length;

			var files = this.config.predefined_images;

			for (var x = 0; x < files.length; x++) {
				var html = this.append_image(files[x], x, null, true);
				$('#' + this.container).append(html);

				if (this.config.has_main && this.config.has_main == true) {
					this.refresh_drag();
				}
			}
		}

		var $this = this;

		this.apply_remove_image();

		$(document).on('click', '.btn_rotate', function (e) {
			e.stopImmediatePropagation();

			var type = $(this).attr('data-type');
			var rotate_deg = $(this).parents('.imgbox').find('.img_rotate').val();
			rotate_deg = parseInt(rotate_deg);

			if (type == 'left') {
				rotate_deg -= 90;
			} else {
				rotate_deg += 90;
			}

			$(this).parents('.imgbox').find('.img_rotate').val(rotate_deg);
			$(this).parents('.imgbox').find('img').css('transform', 'rotate(' + rotate_deg + 'deg)');
			$(this).parents('.imgbox').find('img').css("-ms-transform", "rotate(" + rotate_deg + "deg)");
			$(this).parents('.imgbox').find('img').css("-webkit-transform", "rotate(" + rotate_deg + "deg)");

			if ($this.config.on_rotate && $this.config.on_rotate != null) {
				$this.config.on_rotate();
			}
		});


		var hidden_input = document.getElementById('hidden_file_input' + file_upload_instense);

		hidden_input.addEventListener('change', function (e) {
			$this.input_change(e);
		});

		if (this.config.on_init && this.config.on_init != null) {
			this.config.on_init();
		}
	};


	FU.prototype.apply_remove_image = function () {
		var self = this;
		var remove_image = document.getElementsByClassName('remove_image' + this.instense);

		for (var rr = 0; rr < remove_image.length; rr++) {
			remove_image[rr].addEventListener('click', function (e) {
				$(this).parents('.imgbox').remove();
				self.files_count--;

				self.refresh_index();

				self.check_max_upload();

				if (self.config.on_delete && self.config.on_delete != null) {
					self.config.on_delete();
				}
			});
		}
	};


	FU.prototype.set_extensions = function () {
		this.allowed_extensions = [];
		this.allowed_extensions_icons = {};

		var extensions = this.config.extensions;

		if (typeof extensions == 'string') {
			extensions = extensions.split('|');

			for (var i = 0; i < extensions.length; i++) {

				if (extensions[i].indexOf('->') > 0) {
					var parts = extensions[i].split('->');
					var ext = parts[0].toLowerCase();
					var data = parts[1];

					this.allowed_extensions.push(ext);
					this.allowed_extensions_icons[ext] = data;
				} else {
					this.allowed_extensions.push(extensions[i]);
				}
			}
		} else {

			for (var i = 0; i < extensions.length; i++) {
				if (typeof extensions[i] == 'object') {
					this.allowed_extensions.push(extensions[i].type);

					if (extensions[i].hasOwnProperty('icon')) {
						this.allowed_extensions_icons[extensions[i].type] = extensions[i].icon;
					}
				} else {
					this.allowed_extensions.push(extensions[i]);
				}
			}

		}
	};


	FU.prototype.input_change = function (event) {
		for (var x = 0; x < event.target.files.length; x++) {
			if (this.check_max_upload()) return;

			var form_data = new FormData();
			form_data.append('upload_files', event.target.files[x]);

			var fileName = event.target.files[x].name;
			var ext = fileName.split('.');
			ext = ext[ext.length - 1];

			if (this.allowed_extensions.indexOf(ext) == -1) {
				alert('File type .' + ext + ' is not allowed');
			} else {
				this.uploadFiles(form_data, this.files_count);
				this.files_count++;
			}
		}
	};


	// Catch the form submit and upload the files
	FU.prototype.uploadFiles = function (form_data, file_count) {
		var self = this;
		$('#' + self.container).append('<div class="imgbox imgbox-loading-' + file_count + '"><i class="fa fa-refresh fa-spin"></i></div>');

		$.ajax({
			url: this.config.ajax_src,
			cache: false,
			contentType: false,
			processData: false,
			type: 'post',
			data: form_data,
			success: function (data) {
				var is_uploaded = false;
				$('.imgbox-loading-' + file_count).remove();
				try {
					data = JSON.parse(data);
				} catch (e) {
					console.log(e);
				}

				var html = '';
				if (!data || typeof data != 'object') {
					html = '<div class="imgbox imgbox-error" data-index="' + file_count + '"><i class="fa fa-exclamation-triangle"></i></div>';
				} else {
					if (data.error) {
						html = '<div class="imgbox imgbox-error" data-index="' + file_count + '">' + data.message + '</div>';
					} else {
						html = self.append_image(data.name, file_count, self.config.base_url);
						is_uploaded = true;
					}
				}

				$('#' + self.container).append(html);

				if (self.config.has_main && self.config.has_main == true) {
					self.refresh_drag();
				}

				self.apply_remove_image();

				self.check_max_upload();

				if (is_uploaded && self.config.on_upload && self.config.on_upload != null) {
					self.config.on_upload(data.name);
				} else if (self.config.on_error && self.config.on_error != null) {
					self.config.on_error();
				}
			}
		});
	};


	FU.prototype.append_image = function (image_name, file_count, base_url, is_predefined) {
		base_url = (base_url && base_url != '') ? base_url : '';
		var ext = image_name.split('.');
		ext = ext[ext.length - 1];
		var img = '';

		if (this.allowed_extensions_icons.hasOwnProperty(ext)) {
			var icon = this.allowed_extensions_icons[ext];

			if (icon.indexOf('[') == 0 && icon.lastIndexOf(']') == icon.length - 1) {
				img = icon.slice(1, -1);
			} else if (icon.indexOf('<') == 0 && icon.lastIndexOf('>') == icon.length - 1) {
				img = icon;
			} else {
				img = '<img src="' + icon + '" alt="">';
			}

		} else {
			img = '<img src="' + base_url + image_name + '" alt="">';

			if (this.config.has_rotation) {
				img += '<button type="button" class="btn_rotate" data-type="left"><i class="fa fa-undo"></i></button>\
					<button type="button" class="btn_rotate" data-type = "right"><i class = "fa fa-repeat"></i></button>';
			}
		}

		var old_check = (is_predefined) ? 'uploaded:' : '';

		var html = '<div class="imgbox" data-index="' + file_count + '">\
			<input type="hidden" class="img_index" name="' + this.config.post_file_index + '[' + file_count + ']" value = "' + file_count + '" >\
		<input type="hidden" class="img_name" name="' + this.config.post_file_name + '[' + file_count + ']" value = "' + old_check + base_url + image_name + '" >\
		<input type="hidden" class="img_rotate" name="' + this.config.post_file_rotate + '[' + file_count + ']" value = "0" >\
		' + img + '\
		<button type="button" class="remove_image remove_image' + this.instense + '" > <i class="fa fa-times"></i></button>\
		</div>';

		return html;
	};


	FU.prototype.check_max_upload = function () {
		if (this.files_count >= this.config.max_upload) {
			$(this.config.selector).find('.select_files_btn').attr('disabled', true);
			$(this.config.selector).find('.hidden_file_input').hide();
			return true;
		} else {
			$(this.config.selector).find('.select_files_btn').attr('disabled', false);
			$(this.config.selector).find('.hidden_file_input').show();
			return false;
		}
	};


	FU.prototype.refresh_drag = function () {
		var self = this;
		$("#" + self.container).disableSelection();

		$("#" + self.container).sortable({
			placeholder: "sortable-placeholder",
			update: function (event, ui) {
				self.refresh_index();

				if (self.config.on_drop && self.config.on_drop != null) {
					self.config.on_drop();
				}
			}
		});
	};


	FU.prototype.refresh_index = function () {
		var self = this;

		$('#' + self.container + ' .imgbox').each(function (e) {
			$(this).attr('data-index', e);
			$(this).find('.img_index').val(e);

			$(this).find('.img_index').attr('name', '' + self.config.post_file_index + '[' + e + ']');

			$(this).find('.img_name').attr('name', '' + self.config.post_file_name + '[' + e + ']');

			$(this).find('.img_rotate').attr('name', '' + self.config.post_file_rotate + '[' + e + ']');
		});
	};


	window.file_upload_preview = FU;
})();