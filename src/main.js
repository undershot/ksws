;(function ($, window) {
	// Ochevidniy kommmentariy chto eto config
	const Config = {

		accessories: {
			beards: null,
			hats: null,
			glasses: null
		},

		initialTransforms: {
			scale: 1,
			rotate: 0
		},

		styles: {},

		out: {
			beards: "#submenu_2",
			hats: "#submenu_3",
			glasses: "#submenu_1",
		},

		$selected: null

	};


	// Needed elements
	const Fields = {
		canvas: document.createElement("canvas"),
		picture: $("#picture"),
		save: $("#save"),
		accessories: $("div.accessories"),
		plus: $("#plus"),
		minus: $("#minus"),
		left: $("#left"),
		right: $("#right"),
		dropzone: $("#dropzone"),
		photo: $("#imageFace"),
		menuitems: $("div.menuitem")
	};

	// Positions
	const Pos = {
		picture: () => {
			return {
				offset: Fields.picture.offset(),
				width: Fields.picture.width(),
				height: Fields.picture.height()
			}
		},
	};


	/**
	 * @description Drop files here
	 * */
	const Dropzone = function () {

		const reader = new FileReader();

		const _maxFileSize = 300 * 1024;

		reader.onload = (a) => {
			alert("Файл загружен");
			Fields.photo.css({
				backgroundImage: `url(${a.target.result})`
			});
		};

		const receiveFiles = (files) => {
			if (files.length > 1) {
				alert("Ошибка\n\nРазрешается использовать только 1 фото");
				return false;
			}

			if (files[0].type !== "image/jpeg") {
				alert("Ошибка\n\nРазрешенный формат: .jpeg");
				return false;
			}

			if (files[0].size > _maxFileSize) {
				alert("Ошибка\n\nРазмер фото превышет лимит в 300kb");
				return false;
			}

			reader.readAsDataURL(files[0]);
		};

		this.init = () => {

			let d = Fields.dropzone;

			alert("Пожалуйста, перетащите фото для загрузки");

			d.on("dragenter dragleave dragend drop dragover", (e) => {
				e.preventDefault();
				e.stopPropagation();
			});

			d.on("dragover", (e) => {
				e.originalEvent.dataTransfer.dropEffect = "copy";
			});

			d.on("dragenter", () => {
				if (!d.hasClass("dragentered")) d.addClass("dragentered");
			});

			d.on("dragleave", () => {
				if (d.hasClass("dragentered")) d.removeClass("dragentered");
			});

			d.on("drop", (e) => {

				if (d.hasClass("dragentered")) d.removeClass("dragentered");

				receiveFiles(e.originalEvent.dataTransfer.files);

			})

		};

	};

	/**
	 * @description Selectable items
	 * */
	const Selectables = function () {
		this.init = () => {
			$("body").on("click", ".selectable", function () {
				Selectables.setActive($(this));
			});
		};
	};
	Selectables.setActive = ($el) => {
		if (Config.$selected) Config.$selected.removeClass("selected");

		Config.$selected = $el;
		$el.addClass("selected");
	};

	/**
	 * @description Draggable elements. Other logic with draggable
	 * */
	const Draggables = function () {


		this.init = () => {
			Fields.accessories.draggable({
				classes: {
					"ui-draggable-dragging": "dragging"
				},
				scroll: true,
				stop: (e, ui) => {
					let el = e.target;
					let o = ui.offset;
					let p = Pos.picture();

					let type = el.classList[0];

					if (
						o.top >= p.offset.top - 50 &&
						o.left >= p.offset.left - 50 &&
						o.top <= (p.offset.top - 50) + (p.height + 50) &&
						o.left <= (p.offset.left - 50) + (p.width + 50)
					) {
						// If inside picture

						if (!Config.accessories[type]) {
							Config.accessories[type] = el;

							if (!Config.styles[el.id]) Config.styles[el.id] = Object.assign({}, Config.initialTransforms);

							$(el).addClass("selectable");

							$(el).appendTo("body").css({
								position: "absolute",
								top: o.top,
								left: o.left
							});

							/*let clone = $(el).clone();



							$("body").append($(el).clone());*/

							Selectables.setActive($(el));
						} else {
							if (Config.accessories[type].id !== el.id) {
								el.style.top = 0;
								el.style.left = 0;
								el.style.transform = "none";
							}
						}
					} else {
						// If outside
						if (Config.accessories[type] && Config.accessories[type].id === el.id) {

							if (Config.styles[el.id]) Config.styles[el.id] = null;

							Config.accessories[type] = null;

							if ($(el).hasClass("selectable")) {
								$(el).removeClass("selectable");

								$(el).appendTo(Config.out[type]);

								if ($(el).hasClass("selected")) {
									$(el).removeClass("selected");
								}
							}
						}


						el.style.position = "relative";
						el.style.top = 0;
						el.style.left = 0;
						el.style.transform = "none";
					}
				}
			});
		}
	};

	/**
	 * @description     App controls
	 * @available       +, -, Rotate left, Rotate right
	 * */
	const Controls = function () {

		const getCurrentStyles = ($el = Config.$selected) => {
			let styles = Config.styles[$el[0].id];

			if (!styles) {
				return Object.assign({}, Config.initialTransforms);
			}

			return styles;
		};

		const setStyles = (styles) => {
			Config.$selected.css({
				transform: styles
			});
		};

		const setMatrix = (value) => {
			let def = getCurrentStyles();

			let newStyle = Object.assign(def, value);

			let res = "";

			let v = null;

			Object.keys(newStyle).map((value, index) => {
				v = newStyle[value];

				if (value === "rotate") {
					v = `${v}deg`;
				}

				res += `${value}(${v}) `;
			});

			Config.styles[Config.$selected[0].id] = newStyle;

			return res;
		};

		const setScale = (type, value) => {
			let def = getCurrentStyles();

			let newScale = type === "plus" ? def.scale + value : def.scale - value;

			if (newScale < 0) newScale = 0;

			setStyles(setMatrix({scale: newScale}));
		};

		const setRotate = (type, value) => {
			let def = getCurrentStyles();

			let newRotate = type === "plus" ? def.rotate + value : def.rotate - value;

			setStyles(setMatrix({rotate: newRotate}));

		};

		const onPlusClick = (e) => {
			if (!Config.$selected) return false;

			setScale("plus", 0.2);
		};

		const onMinusClick = () => {
			if (!Config.$selected) return false;

			setScale("minus", 0.2);
		};

		const onLeftClick = () => {
			if (!Config.$selected) return false;

			setRotate("minus", 20);
		};

		const onRightClick = () => {
			if (!Config.$selected) return false;

			setRotate("plus", 20);
		};


		this.init = () => {


			Fields.plus.on("click", onPlusClick);
			Fields.minus.on("click", onMinusClick);
			Fields.left.on("click", onLeftClick);
			Fields.right.on("click", onRightClick);

			console.log("controls");
		};
	};

	/**
	 * @description Collapsible menu
	 * */
	const MenuControls = function () {

		let current = 1;

		this.init = () => {

			$("#submenu_" + current).addClass("visible");

			Fields.menuitems.on("click", function () {
				let c = parseInt(this.id.split("_")[1]);

				if(current === c) return;

				$("#submenu_" + c).addClass("visible");
				$("#submenu_" + current).removeClass("visible");

				current = c;
			});

		};
	};

	/**
	 * @description     Keyboard controls
	 * @available       ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, R, L
	 * */
	const KeysControls = function () {

		const moveAccessory = (type, direction, value) => {
			let $el = Config.$selected;

			if (!$el) return false;

			let newPos = type === "plus" ? `+=${value}px` : `-=${value}px`;

			let a = {};

			a[direction] = newPos;

			// console.log($el)

			$el.css(a);
		};

		this.init = () => {
			$("body").on("keypress keydown", (e) => {
				// console.log(e.keyCode)
				let key = e.keyCode;

				if ([40, 38, 37, 39, 82, 84].indexOf(key) !== -1) e.preventDefault();

				// top
				if (key === 38) {
					moveAccessory("minus", "top", 20);
				}
				// bottom
				if (key === 40) {
					moveAccessory("plus", "top", 20);
				}
				// left
				if (key === 37) {
					moveAccessory("minus", "left", 20);
				}
				// right
				if (key === 39) {
					moveAccessory("plus", "left", 20);
				}


				// L
				if (key === 108) {
					Fields.left[0].click();
				}

				// R
				if (key === 82) {
					Fields.right[0].click();
				}
			})
		};
	};

	// data:image/svg+xml;base64,...do other
	// FileReader
	// readAsDataUrl

	/**
	 * @description MAGIC MAGIC MAGIC
	 * */
	const CanvasWorker = function () {
		// WORKER

		const getStyles = () => {
			let list = [
				"position", "top", "left", "right", "bottom",
				"width", "height", "background", "zIndex"
			];

			let el = Fields.picture;

			let styles = null;

			let r = {};

			let result = [];

			let childs = [
				Config.accessories.beards,
				Config.accessories.hats,
				Config.accessories.glasses,
			];

			childs.map((value, index) => {
				if (!value) return;

				let c = $(value).clone();

				let offs = Pos.picture().offset;

				c.css({
					position: "absolute",
					top: value.offsetTop - offs.top + 10,
					left: value.offsetLeft - offs.left + 10,
				});

				el.append(c);
			});

			let children = el.children();

			// console.log(children);

			children.each((index, value) => {
				styles = window.getComputedStyle(value);
				r = {};

				list.map((val, i) => {
					if (styles[val]) {
						r[val] = styles[val];
					}
				});

				$(value).css(r);

				result.push(r);
			});

			return new Promise((res, rej) => {
				res(children);
			})
		};

		const setInlineStyles = (children) => {
			return new Promise((res, rej) => {
				res(11);
			})
		};

		const getHTML = (c) => {
			return new Promise((res, rej) => {
				let html = Fields.picture.html();

				html = html.replace(/&quot;/g, "");

				res(html);
			})
		};

		const getAllUrls = (html) => {

			return new Promise((res, rej) => {
				let i = /url\((.+?)\)/g;

				let matches = html.match(i);
				let mLength = matches.length;

				let current = 0;

				let result = [];


				// FUCKIN' RECURSIVE
				let a = () => {
					let img = matches[current].replace(i, "$1");

					imageToBase64(img).then((r) => {
						html = html.replace(img, r);

						if (current === mLength - 1) {
							res(html);
						} else {
							current++;
							a();
						}
					});
				};

				a();
			});
		};

		/**
		 * @description Image url (http://...) ---> Base64 with canvas
		 * */
		const imageToBase64 = (url) => {

			return new Promise((res, rej) => {
				let canvas = document.createElement("canvas");
				let img = new Image;
				let ctx = canvas.getContext("2d");

				img.src = url;

				img.onload = () => {

					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;

					ctx.drawImage(img, 0, 0);


					let d = canvas.toDataURL();

					// $("#test").attr("src", d);

					res(d);

					canvas = null;
				}

			});


		};

		const template = (html) => {
			return `
<svg xmlns="http://www.w3.org/2000/svg" width="460" height="600">
    <foreignObject width="100%" height="100%">
        <body xmlns="http://www.w3.org/1999/xhtml">
            ${html}
        </body>
    </foreignObject>
</svg>`;
		};

		const convertSvgToPng = (html) => {

			/**
			 * @description Create image, then put our generated SVG/Base64
			 *              string to src and wait until it will be loaded
			 * */
			return new Promise((res, rej) => {

				// btoa - string ---> base64
				let svg = "data:image/svg+xml;base64," + btoa(template(html));
				let canvas = Fields.canvas;
				let ctx = canvas.getContext("2d");

				let img = new Image;

				img.src = svg;

				img.onload = () => {
					canvas.width = img.naturalWidth;
					canvas.height = img.naturalHeight;

					ctx.drawImage(img, 0, 0);

					let d = canvas.toDataURL();

					// $("#test").attr("src", d);

					res(d);
				};

			});


		};


		const generateImage = () => {


			/**
			 * @description Many thanks to Promise original creators.
			 *              It's save my life.
			 *              Async is a true way for you.
			 *              No comment above, because it can be understand from juniour to senior.
			 * */
			return getStyles().then((r) => {
				return setInlineStyles(r);
			}).then((r) => {
				return getHTML(r);
			}).then((r) => {
				return getAllUrls(r);
			}).then(r => {
				// Fields.picture.html(r);
				return convertSvgToPng(r);
			}).then(r => {
				Fields.picture.children(".accessories").remove();


				// Download photo
				let a = document.createElement("a");

				a.href = r;
				a.download = `fanny_faces_${new Date().getTime()}.png`;

				a.click();
			})
		};


		// generateImage();

		this.generateImage = () => {
			return generateImage();
		};

		this.init = () => {
			console.log("canvas init");

			Fields.save.on("click", () => {
				this.generateImage();
			});
		};
	};

	/**
	 * @description Main initializer
	 * */
	$(window).on("load", () => {
		let dropzone = new Dropzone();
		let selectables = new Selectables();
		let draggables = new Draggables();
		let controls = new Controls();
		let canvas = new CanvasWorker();
		let keys = new KeysControls();
		let menu = new MenuControls();

		dropzone.init();
		selectables.init();
		draggables.init();
		controls.init();
		canvas.init();
		keys.init();
		menu.init();
	});


}(window.jQuery, window));


