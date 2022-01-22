
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\board\Coin.svelte generated by Svelte v3.44.3 */

    const file$a = "src\\components\\board\\Coin.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let div_id_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "coin svelte-1oo0wzo");
    			attr_dev(div, "id", div_id_value = "coin-" + /*code*/ ctx[0] + "-" + /*i*/ ctx[1]);
    			set_style(div, "background-color", "var(--" + /*code*/ ctx[0] + "-player)");
    			add_location(div, file$a, 4, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*code, i*/ 3 && div_id_value !== (div_id_value = "coin-" + /*code*/ ctx[0] + "-" + /*i*/ ctx[1])) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*code*/ 1) {
    				set_style(div, "background-color", "var(--" + /*code*/ ctx[0] + "-player)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Coin', slots, []);
    	let { code, i } = $$props;
    	const writable_props = ['code', 'i'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Coin> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('code' in $$props) $$invalidate(0, code = $$props.code);
    		if ('i' in $$props) $$invalidate(1, i = $$props.i);
    	};

    	$$self.$capture_state = () => ({ code, i });

    	$$self.$inject_state = $$props => {
    		if ('code' in $$props) $$invalidate(0, code = $$props.code);
    		if ('i' in $$props) $$invalidate(1, i = $$props.i);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [code, i];
    }

    class Coin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { code: 0, i: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Coin",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*code*/ ctx[0] === undefined && !('code' in props)) {
    			console.warn("<Coin> was created without expected prop 'code'");
    		}

    		if (/*i*/ ctx[1] === undefined && !('i' in props)) {
    			console.warn("<Coin> was created without expected prop 'i'");
    		}
    	}

    	get code() {
    		throw new Error("<Coin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<Coin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Coin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Coin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Ludo Steps ID Map Reference
     * 
     *                    01 07 13
     *                    02 08 14
     *                    03 09 15
     *                    04 10 16
     *                    05 11 17
     *                    06 12 18
     *  19 20 21 22 23 24          42 41 40 39 38 37
     *  25 26 27 28 29 30          48 47 46 45 44 43
     *  31 32 33 34 35 36          54 53 52 51 50 49 
     *                    60 66 72
     *                    59 65 71
     *                    58 64 70
     *                    57 63 69
     *                    56 62 68
     *                    55 61 67
     */

    const COLORS = ["red", "yellow", "green", "blue"];

    const LUDO_PATH = [
        19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1, 7, 13, 14, 15, 16, 17, 18,
        42, 41, 40, 39, 38, 37, 43, 49, 50, 51, 52, 53, 54, 72, 71, 70, 69, 
        68, 67, 61, 55, 56, 57, 58, 59, 60, 36, 35, 34, 33, 32, 31, 25
    ];

    const START_POINTS = {
        red: 20, 
        blue: 14,
        yellow: 50,
        green: 56
    };

    const HOME_PATHS = {
        red: [26, 27, 28, 29, 30],
        blue: [8, 9, 10, 11, 12],
        yellow: [44, 45, 46, 47, 48],
        green: [62, 63, 64, 65, 66]
    };

    const NULL_POINTS = [33, 69, 39, 3, ...Object.values(START_POINTS)];

    const PLAYER_PATHS = 
        Object.fromEntries(
            COLORS.map(color => {
                let x = LUDO_PATH.indexOf(START_POINTS[color]);
                let sliced = LUDO_PATH.slice(x, x + 51);
                if (sliced.length != 51) sliced = sliced.concat(LUDO_PATH.slice(0, 51 - sliced.length));
                return [color, sliced.concat(HOME_PATHS[color])]
            })
        );

    // TODO(scientific-dev): Find a better way for dice html sides...
    const DICE_HTML_SIDES = [
        `<div class="dot"></div>`,
        `<div class="dot"></div>`.repeat(2),
        `<div class="dot"></div>`.repeat(3),
        `<div class="flex"><div class="dot"></div> <div class="dot"></div></div>`.repeat(2),
        `
        <div class="flex"><div class="dot"></div> <div class="e-dot"></div> <div class="dot"></div></div> 
        <div class="flex"><div class="e-dot"></div> <div class="dot"></div></div> 
        <div class="flex"><div class="dot"></div> <div class="e-dot"></div> <div class="dot"></div></div>
    `,
        `<div class="flex"><div class="dot"></div> <div class="dot"></div></div>`.repeat(3),
    ];

    const HOUSE_SIDES = {
        red: 'top-left',
        blue: 'top-right',
        green: 'bottom-left',
        yellow: 'bottom-right'
    };

    class LudoAlert {

        constructor () {
            let alertElement = document.createElement('div');
            alertElement.className = 'alert';
            alertElement.style.opacity = 0;
            this.element = alertElement;
        }

        setInnerHTML (html) {
            this.element.innerHTML = html;
            return this;
        }

        appendChildren (...children) {
            this.element.append(...children);
            return this;
        }

        setParent (elem) {
            this.parent = elem;
            this.parent.prepend(this.element);
            return this;
        }

        removeParent () {
            this.parent.removeChild(this.element);
            return this;
        }

        async display (ms = 200) {
            await sleep(ms);
            this.element.style.opacity = 1;
            return this;
        }

        async undisplay () {
            this.element.style.opacity = 0;
            await sleep(200);
            return this.removeParent();
        }

    }

    class LudoPlayer {

        static NULL_PLAYER = new LudoPlayer('No Player', "null").null();

        kills = 0;
        cors = [null, null, null, null];
        // Coordinates of coins. 
        // - number, if the coin is on track
        // - null, if coin at start.
        // - NaN, if coin has reached the house.

        constructor (name, color, isBot) {
            this.name = name;
            this.color = color;
            if (isBot) this.isBot = true;
        }

        static fromJSON (json) {
            let pl = new LudoPlayer(json.name, json.color);

            pl.cors = json.cors.map(x => x == 'nan' ? NaN : x);
            pl.kills = json.kills;

            if (json.color) pl.color = json.color;
            if (json.rank) pl.rank = json.rank;
            if (json.bot) pl.isBot = json.bot;

            return pl;
        }

        get coinsReached () {
            return this.cors.filter(x => isNaN(x)).length;
        }

        get coinsAtPrison () {
            // Because null is object and others are number including NaN.
            return this.cors.filter(x => typeof x == "object").length;
        }

        get coinsOutside () {
            return this.cors.filter(x => !isNaN(x) && typeof x == "number").length;
        }

        get completed () {
            for (let i = 0; i < this.cors.length; i++)
                if (!isNaN(this.cors[i])) return false;

            return true;
        }

        get startPoint () {
            return START_POINTS[this.color];
        }

        get activeCoinsIndices () {
            let coins = [];

            for (let i = 0; i < this.cors.length; i++) {
                let x = this.cors[i];
                if (!isNaN(x) && typeof x == "number") coins.push(i);
            }

            return coins;
        }

        get coinsInsideIndices () {
            let coins = [];
            for (let i = 0; i < this.cors.length; i++)
                if (typeof this.cors[i] == "object") coins.push(i);

            return coins;
        }

        get type () {
            if (this.isBot) return 'bot';
            if (this.isNull) return 'null';
            return 'player';
        }

        null () {
            this.isNull = true;
            return this;
        }

        toJSON () {
            return {
                kills: this.kills,
                cors: this.cors.map(x => isNaN(x) ? 'nan' : x),
                name: this.name,
                color: this.color,
                bot: this.isBot
            };
        }

    }

    function E () {
      // Keep this empty so it's easier to inherit from
      // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
    }

    E.prototype = {
      on: function (name, callback, ctx) {
        var e = this.e || (this.e = {});

        (e[name] || (e[name] = [])).push({
          fn: callback,
          ctx: ctx
        });

        return this;
      },

      once: function (name, callback, ctx) {
        var self = this;
        function listener () {
          self.off(name, listener);
          callback.apply(ctx, arguments);
        }
        listener._ = callback;
        return this.on(name, listener, ctx);
      },

      emit: function (name) {
        var data = [].slice.call(arguments, 1);
        var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
        var i = 0;
        var len = evtArr.length;

        for (i; i < len; i++) {
          evtArr[i].fn.apply(evtArr[i].ctx, data);
        }

        return this;
      },

      off: function (name, callback) {
        var e = this.e || (this.e = {});
        var evts = e[name];
        var liveEvents = [];

        if (evts && callback) {
          for (var i = 0, len = evts.length; i < len; i++) {
            if (evts[i].fn !== callback && evts[i].fn._ !== callback)
              liveEvents.push(evts[i]);
          }
        }

        // Remove event from queue to prevent memory leak
        // Suggested by https://github.com/lazd
        // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

        (liveEvents.length)
          ? e[name] = liveEvents
          : delete e[name];

        return this;
      }
    };

    var tinyEmitter = E;
    var TinyEmitter = E;
    tinyEmitter.TinyEmitter = TinyEmitter;

    Array.prototype.random = function () {
        return this[Math.floor(Math.random() * this.length)];
    };

    String.prototype.toProperCase = function () {
        return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    };

    Element.prototype.setNodeIDCss = function () {
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].style.setProperty('--node-id', i + 1);
        }
    };

    async function sleep (ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function getRandom (n) {
        return Math.floor(Math.random() * n);
    }

    function nthString (n) {
        if (n == 1) return '1st';
        else if (n == 2) return '2nd';
        else if (n == 3) return '3rd';
        else return `${n}th`;
    }

    class LudoEngine extends TinyEmitter {

        started = false;
        ended = false;
        activePlayers = []; // Will be defined when the game starts...
        activeBots = [];
        currentTurn = 0;
        ranks = [];
        players = {
            red: new LudoPlayer('You', 'red'),
            green: LudoPlayer.NULL_PLAYER,
            yellow: LudoPlayer.NULL_PLAYER,
            blue: LudoPlayer.NULL_PLAYER
        };

        get playersArray () {
            return Object.values(this.players);
        }

        get playerCount () {
            return this.playersArray.filter(x => !x.isNull).length;
        }

        get currentTurnPlayer () {
            return this.activePlayers[this.currentTurn];
        }

        nextTurn () {
            let x = this.activePlayers.length - 1;
            this.currentTurn += (this.currentTurn == x) ? -x : 1;
        }

        onWindowLoad () {
            // These things can be done directly through svelte but 
            // still I prefer to do it like this...
            let styleElement = document.createElement('style');

            styleElement.innerHTML = 
                NULL_POINTS
                    .map(id => `#step-${id} {background-color:var(--dark-step-color)!important}`)
                    .join('');

            styleElement.innerHTML += 
                Object.entries(START_POINTS)
                    .map(([color, id]) => `#step-${id} {background-color:var(--${color}-player)!important}`)
                    .join('');

            document.getElementById('wrap').append(styleElement);

            if (this.started) {
                this.emit('start');
                this.alert('Resuming your game...', 1200);
            }
        }

        createPlayer (isBot) {
            let entry = Object.entries(this.players).find(([_, player]) => player.isNull);
            if (!entry) return null;

            this.players[entry[0]] = new LudoPlayer(isBot ? 'Bot' : 'Player', entry[0], isBot);
            this.emit(`${entry[0]}Update`)
                .emit('playerCountUpdate');

            return this.players[entry[0]];
        }

        deletePlayer (color) {
            if (this.playerCount == 1) return null;
            let player = this.players[color];

            this.players[color] = LudoPlayer.NULL_PLAYER;
            this.emit(`${color}Update`)
                .emit('playerCountUpdate');

            return player;
        }

        updatePlayerName(color, name) {
            // The engine may crash if wrong values supplied but
            // only if someone makes a fault in the engine.
            this.players[color].name = name;
            this.emit(`${color}Update`);
        }

        async start () {
            if (this.started) return false;

            this.activePlayers = [];
            Object.entries(this.players)
                .forEach(x => !x[1].isNull ? this.activePlayers.push(x[1]) : null);

            if (this.activePlayers.length < 2) return false;

            this.started = true;
            this.emit('start');
            this.activeBots = this.activePlayers.filter(x => x.isBot);
            this.clearSaved();

            await this.alert('The game has started...', 1000);
            return this.startTurns();
        }

        async startTurns () {
            // A bonus roll when if the die is rolled at 6, killed a coin
            // or one coin reached a house.
            let isBonusRoll = false;

            while (!(await this.checkForCompletion())) {
                let current = this.currentTurnPlayer;
                let isPlayer = !current.isBot;
                this.save(); // Autosaves the progress so you don't mess up later!
                
                if (current.completed) {
                    // Sometimes ranks may not appear...
                    if (!this.ranks.includes(current)) await this.pushRank(current);
                    this.nextTurn();
                    continue;
                }

                // If it isn't a bonus roll, it would consider as a new turn
                if (!isBonusRoll) {
                    this.emit(`turn`, current.color);
                    if (isPlayer) await this.waitForEvent('diceRoll');
                }

                let diceNumber = (await this.diceRoll(current.name + '\'s')) + 1;
                let coinsInside = current.coinsInsideIndices;
                let is6 = diceNumber == 6; // Just to reduce some code...
                isBonusRoll = is6;

                if (coinsInside.length == 4) {
                    if (is6) {
                        current.cors[0] = 0;
                        await this.moveCoin(current.color, 1, current.startPoint);
                        this.emit(`${current.color}Update`);
                    } else await this.alert('Unfortunate!', 1200);
                } else {
                    let type;

                    // If there is a number other than 6 but no coins outside the prison
                    // then the turn is skipped...
                    if (!is6 && !current.coinsOutside) {
                        isBonusRoll = false;
                        await this.alert('Unfortunate! No coins to move!', 1200);
                        this.nextTurn();
                        continue;
                    }

                    // Makes the prison selectable...
                    if (is6 && isPlayer) this.emit(`${current.color}PrisonSelectable`);

                    // If it is a player, it awaits for a decision.
                    // If it is a bot, it calculates moments and returns a decision.
                    if (isPlayer) {
                        await this.alert('Select your move...', 1100);
                        type = await this.waitForEvent(`${current.color}Select`);
                    } else type = this.getBotChoice(current, coinsInside.length, diceNumber);

                    if (type == 'prison') {
                        // The type 'prison' means the decision maker is asking
                        // to release a coin from the prison.

                        let x = coinsInside.random(); // Takes a random coin to release from prison
                        current.cors[x] = 0;
                        await this.moveCoin(current.color, x + 1, current.startPoint);
                        this.emit(`${current.color}Update`);
                    } else if (typeof type[0] == "number") {
                        // If the decision is returned in [number] format then it 
                        // is asking to move that paticular coin.
                        // It is in the format [number] for future purposes...

                        let { 
                            bonusRoll, // Boolean stating that this move got a bonus roll or not.
                            newStep, // Returns the new step id.
                            gameOver, // Boolean stating if the game got over with this move.
                            playerCompleted // Boolean stating if the player has completed the game with this move.
                        } = await this.moveCoinInPath(current.color, type[0], current, diceNumber);
                        
                        if (gameOver) break;
                        // If the player has completed his game, then there is no need of bonus rolls...
                        if (playerCompleted) isBonusRoll = false;
                        else {
                            isBonusRoll = isBonusRoll || bonusRoll;
                            // If the new step exists, it checks coins which can be killed...
                            if (!isNaN(newStep)) 
                                isBonusRoll = (await this.killCoins(current, newStep)) || isBonusRoll;
                        }
                    }

                    // Makes the prison selectable.
                    if (is6 && isPlayer) this.emit(`${current.color}PrisonSelectable`);
                }

                // If it is a bonus roll, it displays a screen that it is rolling again
                // else moves to next turn.
                if (isBonusRoll) await this.alert('Rolling again...', 750);
                else this.nextTurn();
            }

            this.end();
            return true;
        }

        async moveCoinInPath (color, id, player, toAdd) {
            let coinID = `coin-${color}-${id}`;
            let cor = player.cors[id - 1] + toAdd;
            let newStep = PLAYER_PATHS[color][cor];

            if (!newStep) {
                player.cors[id - 1] = NaN;
                
                let coinElement = document.getElementById(coinID);
                let playerCompleted = player.completed;

                coinElement.parentElement.removeChild(coinElement);
                await this.alert(`${player.name}'s coin has reached the house!`, 1100);

                if (playerCompleted) await this.pushRank(player, true, false);
                this.emit(`${color}Update`);

                return { 
                    bonusRoll: true, 
                    newStep: NaN, 
                    gameOver: await this.checkForCompletion(),
                    playerCompleted
                };
            }

            player.cors[id - 1] = cor;
            await this.moveCoin(color, id, newStep);

            return { bonusRoll: false, newStep };
        }

        async killCoins (currentPlayer, step) {
            if (NULL_POINTS.includes(step)) return;

            // Find a better way to do this thing...
            for (let i = 0; i < this.activePlayers.length; i++) {
                let player = this.activePlayers[i];
                if (player == currentPlayer) continue;

                let path = PLAYER_PATHS[player.color];
                let kills = 0;

                for (let i = 0; i < player.cors.length; i++) {
                    if (path[player.cors[i]] == step) {
                        player.cors[i] = null;
                        kills += 1;
                        await this.moveCoinToPrison(player.color, i + 1);
                    }
                }

                if (kills) {
                    currentPlayer.kills += kills;
                    this.emit(`${player.color}Update`)
                        .emit(`${currentPlayer.color}Update`);

                    return true;
                }
            }
        }

        async moveCoin (color, number, stepID) {
            let coinElement = document.getElementById(`coin-${color}-${number}`);
            let stepElement = document.getElementById(`step-${stepID}`);
            let clonedCoin = coinElement.cloneNode();
            
            coinElement.classList.add('coin-exit');
            await sleep(500);
            coinElement.parentElement.removeChild(coinElement);

            clonedCoin.addEventListener('click', () => this.emit(`${color}Select`, number));
            clonedCoin.classList.add('coin-active');
            stepElement.appendChild(clonedCoin);
            stepElement.setNodeIDCss();
            await sleep(400);
        }

        async moveCoinToPrison (color, n) {
            let coinElement = document.getElementById(`coin-${color}-${n}`);
            let stepElement = coinElement.parentElement;
            let clonedCoin = coinElement.cloneNode();
            
            coinElement.classList.add('coin-exit');
            await sleep(500);
            coinElement.parentElement.removeChild(coinElement);

            clonedCoin.classList.add('coin-active');
            document.querySelector(`#prison-${color} .prison-inner div`).appendChild(clonedCoin);
            stepElement.setNodeIDCss();
            await sleep(400);
        }

        waitForEvent (evt) {
            return new Promise (resolve => {
                const event = (...args) => {
                    this.off(evt, event);
                    resolve(args);
                };

                this.on(evt, event);
            });
        }

        getBotChoice (current, diceNumber, hasCoinsInPrison) {
            // The brain of a very poor ai...
            let indices = current.activeCoinsIndices;

            return (
                !indices.length || 
                (diceNumber == 6 && hasCoinsInPrison && getRandom(2))
            ) ? 'prison' : [this.getBotCoinChoice(current, indices, diceNumber) + 1];
        }

        getBotCoinChoice (current, indices, diceNumber) {
            let playerPath = PLAYER_PATHS[current.color];
            let futureCors = [];

            for (let i = 0; i < current.cors.length; i++) {
                let cor = current.cors[i];
                if (isNaN(cor)) futureCors.push(NaN);
                else {
                    let fc = playerPath[cor + diceNumber];
                    if (!fc) return i;
                    futureCors.push(fc);
                }        }

            for (let i = 0; i < this.activePlayers.length; i++) {
                let player = this.activePlayers[i];
                for (let i = 0; i < player.cors.length; i++) {
                    let c = player.cors[i];
                    let x = futureCors.findIndex(c1 => typeof c1 == "number" && c1 == c);
                    if (x != -1) return x;
                }
            }

            return indices.random();
        }

        async checkForCompletion () {
            if (this.ranks.length == 3) {
                // This might look not the most efficient but the maximum array size would
                // be 4 so it should not be a problem...
                await this.pushRank(this.activePlayers.find(x => !this.ranks.includes(x)));
                return true;
            }

            for (let i = 0; i < this.activePlayers.length; i++) {
                let player = this.activePlayers[i];
                if (!player.isBot && !player.completed) return false;
            }

            // There might be chances that there are some bots still alive
            // even if all players are eliminated...
            for (let i = 0; i < this.activeBots.length; i++) {
                let bot = this.activeBots[i];
                if (!bot.completed) await this.pushRank(bot, false);
            }

            return true;
        }

        async pushRank (player, toAlert = true, toUpdate = true) {
            this.ranks.push(player);
            player.rank = this.ranks.length;
            if (toAlert) await this.alert(`${player.name} has won the ${nthString(this.ranks.length)} place!`, 1100);
            this.emit('canDisplayResults');
            if (toUpdate) this.emit(`${player.color}Update`);
        }

        getRandomDiceSideHTML () {
            return this.getDiceSideHTML(getRandom(6));
        }

        getDiceSideHTML (n) {
            return `<div class="dside-${n + 1}">${DICE_HTML_SIDES[n]}</div>`;
        }

        toJSON () {
            return {
                started: this.started,
                ended: this.ended,
                currentTurn: this.currentTurn,
                ranks: this.ranks.map(x => x.color),
                players: this.activePlayers.map(player => player.toJSON())
            };
        }

        save () {
            localStorage.setItem('ludo_data', JSON.stringify(this.toJSON()));
        }

        clearSaved () {
            localStorage.removeItem('ludo_data');
        }

        async startFromSaved () {
            let data = JSON.parse(localStorage.getItem('ludo_data') || '{}');
            let promises = [];

            this.started = false;
            this.ended = false;
            this.currentTurn = data.currentTurn;
            this.activeBots = [];
            this.activePlayers = data.players.map(LudoPlayer.fromJSON);
            this.activeBots = this.activePlayers.filter(x => x.isBot);
            this.ranks = [];
            this.players = {
                red: LudoPlayer.NULL_PLAYER,
                green: LudoPlayer.NULL_PLAYER,
                yellow: LudoPlayer.NULL_PLAYER,
                blue: LudoPlayer.NULL_PLAYER
            };

            for (let i = 0; i < this.activePlayers.length; i++) {
                let player = this.activePlayers[i];
                let path = PLAYER_PATHS[player.color];

                this.players[player.color] = player;
                this.emit(`${player.color}Update`);

                for (let i = 0; i < player.cors.length; i++) {
                    let n = player.cors[i];

                    if (isNaN(n)) {
                        let coinElement = document.getElementById(`coin-${player.color}-${i + 1}`);
                        coinElement.parentElement.removeChild(coinElement);
                    } else if (typeof n == "number")
                        promises.push(this.moveCoin(player.color, i + 1, path[n]));
                }
            }

            for (let i = 0; i < data.ranks.length; i++) {
                let player = this.players[data.ranks[i]];
                player.rank = i + 1;
                this.ranks.push(player);
            }

            if (this.ranks.length) this.emit('canDisplayResults');
            if (data.ended) this.end().emit('displayResult');
            else if (data.started) {
                this.started = true;
                this.emit('start');
            }

            await Promise.all(promises);
            if (data.started) {
                await this.alert('The game has resumed...', 1000);
                await this.startTurns();
            }
        }

        async alert (message, waitTill = 2000) {
            let alrt = await new LudoAlert()
                .setParent(document.querySelector('.board-wrapper'))
                .setInnerHTML(`<p>${message}</p>`)
                .display(0);
            
            await sleep(waitTill);
            await alrt.undisplay();
        }

        async diceRoll (userName = 'Your', result = getRandom(6)) {
            let pElement = document.createElement('p');
            pElement.innerHTML = `${userName} Turn`;

            let diceElement = document.createElement('div');
            diceElement.className = 'dice';
            diceElement.innerHTML = this.getRandomDiceSideHTML();

            let alrt = await new LudoAlert()
                .appendChildren(pElement, diceElement)
                .setParent(document.querySelector('.board-wrapper'))
                .display();

            for (let i = 0; i < 4; i++) {
                await sleep(i * 50);
                diceElement.innerHTML = this.getRandomDiceSideHTML();
            }

            await sleep(200);
            diceElement.innerHTML = this.getDiceSideHTML(result);
            await sleep(400);
            diceElement.style.transform = 'scale(1.2)';
            await sleep(250);
            diceElement.style.transform = 'scale(1)';
            await sleep(750);
            await alrt.undisplay();

            return result;
        }

        end () {
            this.started = false;
            this.ended = true;
            this.save(); // A final save...
            this.emit('end');
            return this;
        }

    }

    // The default and primary ludo engine where the game process exists...
    const engine = new LudoEngine();
    const hasSaved = Boolean(localStorage.getItem('ludo_data'));

    /* src\components\board\Prison.svelte generated by Svelte v3.44.3 */
    const file$9 = "src\\components\\board\\Prison.svelte";

    function create_fragment$9(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let coin0;
    	let t0;
    	let coin1;
    	let t1;
    	let coin2;
    	let t2;
    	let coin3;
    	let div2_style_value;
    	let div3_class_value;
    	let div3_id_value;
    	let current;
    	let mounted;
    	let dispose;

    	coin0 = new Coin({
    			props: { code: /*code*/ ctx[1], i: 1 },
    			$$inline: true
    		});

    	coin1 = new Coin({
    			props: { code: /*code*/ ctx[1], i: 2 },
    			$$inline: true
    		});

    	coin2 = new Coin({
    			props: { code: /*code*/ ctx[1], i: 3 },
    			$$inline: true
    		});

    	coin3 = new Coin({
    			props: { code: /*code*/ ctx[1], i: 4 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(coin0.$$.fragment);
    			t0 = space();
    			create_component(coin1.$$.fragment);
    			t1 = space();
    			create_component(coin2.$$.fragment);
    			t2 = space();
    			create_component(coin3.$$.fragment);
    			attr_dev(div0, "class", "flex flex-wrap");
    			add_location(div0, file$9, 36, 12, 1146);
    			attr_dev(div1, "class", "prison-inner svelte-17tvo21");
    			set_style(div1, "margin", /*prisonInnerMargin*/ ctx[4] + "px");
    			set_style(div1, "width", /*innerPrisonSize*/ ctx[3] + "px");
    			set_style(div1, "height", /*innerPrisonSize*/ ctx[3] + "px");
    			add_location(div1, file$9, 28, 8, 902);
    			attr_dev(div2, "class", "prison-cover svelte-17tvo21");
    			attr_dev(div2, "style", div2_style_value = "border-" + HOUSE_SIDES[/*code*/ ctx[1]] + "-radius: 8px;");
    			add_location(div2, file$9, 24, 4, 793);
    			attr_dev(div3, "class", div3_class_value = "prison " + (/*prisonSelectable*/ ctx[0] ? 'prison-selectable' : '') + " svelte-17tvo21");
    			set_style(div3, "width", /*prisonSize*/ ctx[2] + "px");
    			set_style(div3, "height", /*prisonSize*/ ctx[2] + "px");
    			set_style(div3, "--color", "var(--" + /*code*/ ctx[1] + "-player)");
    			attr_dev(div3, "id", div3_id_value = "prison-" + /*code*/ ctx[1]);
    			add_location(div3, file$9, 16, 0, 494);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(coin0, div0, null);
    			append_dev(div0, t0);
    			mount_component(coin1, div0, null);
    			append_dev(div0, t1);
    			mount_component(coin2, div0, null);
    			append_dev(div0, t2);
    			mount_component(coin3, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const coin0_changes = {};
    			if (dirty & /*code*/ 2) coin0_changes.code = /*code*/ ctx[1];
    			coin0.$set(coin0_changes);
    			const coin1_changes = {};
    			if (dirty & /*code*/ 2) coin1_changes.code = /*code*/ ctx[1];
    			coin1.$set(coin1_changes);
    			const coin2_changes = {};
    			if (dirty & /*code*/ 2) coin2_changes.code = /*code*/ ctx[1];
    			coin2.$set(coin2_changes);
    			const coin3_changes = {};
    			if (dirty & /*code*/ 2) coin3_changes.code = /*code*/ ctx[1];
    			coin3.$set(coin3_changes);

    			if (!current || dirty & /*prisonInnerMargin*/ 16) {
    				set_style(div1, "margin", /*prisonInnerMargin*/ ctx[4] + "px");
    			}

    			if (!current || dirty & /*innerPrisonSize*/ 8) {
    				set_style(div1, "width", /*innerPrisonSize*/ ctx[3] + "px");
    			}

    			if (!current || dirty & /*innerPrisonSize*/ 8) {
    				set_style(div1, "height", /*innerPrisonSize*/ ctx[3] + "px");
    			}

    			if (!current || dirty & /*code*/ 2 && div2_style_value !== (div2_style_value = "border-" + HOUSE_SIDES[/*code*/ ctx[1]] + "-radius: 8px;")) {
    				attr_dev(div2, "style", div2_style_value);
    			}

    			if (!current || dirty & /*prisonSelectable*/ 1 && div3_class_value !== (div3_class_value = "prison " + (/*prisonSelectable*/ ctx[0] ? 'prison-selectable' : '') + " svelte-17tvo21")) {
    				attr_dev(div3, "class", div3_class_value);
    			}

    			if (!current || dirty & /*prisonSize*/ 4) {
    				set_style(div3, "width", /*prisonSize*/ ctx[2] + "px");
    			}

    			if (!current || dirty & /*prisonSize*/ 4) {
    				set_style(div3, "height", /*prisonSize*/ ctx[2] + "px");
    			}

    			if (!current || dirty & /*code*/ 2) {
    				set_style(div3, "--color", "var(--" + /*code*/ ctx[1] + "-player)");
    			}

    			if (!current || dirty & /*code*/ 2 && div3_id_value !== (div3_id_value = "prison-" + /*code*/ ctx[1])) {
    				attr_dev(div3, "id", div3_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(coin0.$$.fragment, local);
    			transition_in(coin1.$$.fragment, local);
    			transition_in(coin2.$$.fragment, local);
    			transition_in(coin3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(coin0.$$.fragment, local);
    			transition_out(coin1.$$.fragment, local);
    			transition_out(coin2.$$.fragment, local);
    			transition_out(coin3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(coin0);
    			destroy_component(coin1);
    			destroy_component(coin2);
    			destroy_component(coin3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Prison', slots, []);
    	let { code, cellSize, prisonSize, prisonSelectable } = $$props;
    	engine.on(`${code}PrisonSelectable`, () => $$invalidate(0, prisonSelectable = !prisonSelectable));
    	let innerPrisonSize, prisonInnerMargin;
    	const writable_props = ['code', 'cellSize', 'prisonSize', 'prisonSelectable'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Prison> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		if (prisonSelectable) engine.emit(`${code}Select`, 'prison');
    	};

    	$$self.$$set = $$props => {
    		if ('code' in $$props) $$invalidate(1, code = $$props.code);
    		if ('cellSize' in $$props) $$invalidate(5, cellSize = $$props.cellSize);
    		if ('prisonSize' in $$props) $$invalidate(2, prisonSize = $$props.prisonSize);
    		if ('prisonSelectable' in $$props) $$invalidate(0, prisonSelectable = $$props.prisonSelectable);
    	};

    	$$self.$capture_state = () => ({
    		Coin,
    		engine,
    		HOUSE_SIDES,
    		code,
    		cellSize,
    		prisonSize,
    		prisonSelectable,
    		innerPrisonSize,
    		prisonInnerMargin
    	});

    	$$self.$inject_state = $$props => {
    		if ('code' in $$props) $$invalidate(1, code = $$props.code);
    		if ('cellSize' in $$props) $$invalidate(5, cellSize = $$props.cellSize);
    		if ('prisonSize' in $$props) $$invalidate(2, prisonSize = $$props.prisonSize);
    		if ('prisonSelectable' in $$props) $$invalidate(0, prisonSelectable = $$props.prisonSelectable);
    		if ('innerPrisonSize' in $$props) $$invalidate(3, innerPrisonSize = $$props.innerPrisonSize);
    		if ('prisonInnerMargin' in $$props) $$invalidate(4, prisonInnerMargin = $$props.prisonInnerMargin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellSize, prisonSize, innerPrisonSize*/ 44) {
    			{
    				$$invalidate(3, innerPrisonSize = 4 * cellSize + 4);
    				$$invalidate(4, prisonInnerMargin = (prisonSize - innerPrisonSize - 10) / 2);
    			}
    		}
    	};

    	return [
    		prisonSelectable,
    		code,
    		prisonSize,
    		innerPrisonSize,
    		prisonInnerMargin,
    		cellSize,
    		click_handler
    	];
    }

    class Prison extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			code: 1,
    			cellSize: 5,
    			prisonSize: 2,
    			prisonSelectable: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prison",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*code*/ ctx[1] === undefined && !('code' in props)) {
    			console.warn("<Prison> was created without expected prop 'code'");
    		}

    		if (/*cellSize*/ ctx[5] === undefined && !('cellSize' in props)) {
    			console.warn("<Prison> was created without expected prop 'cellSize'");
    		}

    		if (/*prisonSize*/ ctx[2] === undefined && !('prisonSize' in props)) {
    			console.warn("<Prison> was created without expected prop 'prisonSize'");
    		}

    		if (/*prisonSelectable*/ ctx[0] === undefined && !('prisonSelectable' in props)) {
    			console.warn("<Prison> was created without expected prop 'prisonSelectable'");
    		}
    	}

    	get code() {
    		throw new Error("<Prison>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<Prison>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cellSize() {
    		throw new Error("<Prison>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cellSize(value) {
    		throw new Error("<Prison>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prisonSize() {
    		throw new Error("<Prison>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prisonSize(value) {
    		throw new Error("<Prison>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prisonSelectable() {
    		throw new Error("<Prison>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prisonSelectable(value) {
    		throw new Error("<Prison>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\board\Step.svelte generated by Svelte v3.44.3 */

    const file$8 = "src\\components\\board\\Step.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_id_value;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "step svelte-14ca1mg");
    			attr_dev(div, "id", div_id_value = "step-" + /*i*/ ctx[0]);

    			attr_dev(div, "style", div_style_value = /*color*/ ctx[1]
    			? `background-color: var(--${/*color*/ ctx[1]}-player);`
    			: '');

    			add_location(div, file$8, 5, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*i*/ 1 && div_id_value !== (div_id_value = "step-" + /*i*/ ctx[0])) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*color*/ 2 && div_style_value !== (div_style_value = /*color*/ ctx[1]
    			? `background-color: var(--${/*color*/ ctx[1]}-player);`
    			: '')) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Step', slots, []);
    	let { i } = $$props;
    	let { color = null } = $$props;
    	const writable_props = ['i', 'color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Step> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('i' in $$props) $$invalidate(0, i = $$props.i);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ i, color });

    	$$self.$inject_state = $$props => {
    		if ('i' in $$props) $$invalidate(0, i = $$props.i);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [i, color];
    }

    class Step extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { i: 0, color: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Step",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*i*/ ctx[0] === undefined && !('i' in props)) {
    			console.warn("<Step> was created without expected prop 'i'");
    		}
    	}

    	get i() {
    		throw new Error("<Step>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Step>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Step>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Step>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\board\Walkway.svelte generated by Svelte v3.44.3 */
    const file$7 = "src\\components\\board\\Walkway.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (14:4) {:else}
    function create_else_block$2(ctx) {
    	let step;
    	let t;
    	let each_1_anchor;
    	let current;

    	step = new Step({
    			props: {
    				i: /*offsetIndex*/ ctx[1],
    				cellSize: /*cellSize*/ ctx[0]
    			},
    			$$inline: true
    		});

    	let each_value_1 = Array(5);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(step.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(step, target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const step_changes = {};
    			if (dirty & /*offsetIndex*/ 2) step_changes.i = /*offsetIndex*/ ctx[1];
    			if (dirty & /*cellSize*/ 1) step_changes.cellSize = /*cellSize*/ ctx[0];
    			step.$set(step_changes);

    			if (dirty & /*offsetIndex, color*/ 10) {
    				each_value_1 = Array(5);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(step.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(step.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(step, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(14:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {#if !color}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = Array(6);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*offsetIndex, cellSize*/ 3) {
    				each_value = Array(6);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(10:4) {#if !color}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {#each Array(5) as _, i}
    function create_each_block_1(ctx) {
    	let step;
    	let current;

    	step = new Step({
    			props: {
    				i: /*offsetIndex*/ ctx[1] + /*i*/ ctx[6] + 1,
    				color: /*color*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(step.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(step, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const step_changes = {};
    			if (dirty & /*offsetIndex*/ 2) step_changes.i = /*offsetIndex*/ ctx[1] + /*i*/ ctx[6] + 1;
    			if (dirty & /*color*/ 8) step_changes.color = /*color*/ ctx[3];
    			step.$set(step_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(step.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(step.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(step, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(16:8) {#each Array(5) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (11:8) {#each Array(6) as _, i}
    function create_each_block$1(ctx) {
    	let step;
    	let current;

    	step = new Step({
    			props: {
    				i: /*offsetIndex*/ ctx[1] + /*i*/ ctx[6],
    				cellSize: /*cellSize*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(step.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(step, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const step_changes = {};
    			if (dirty & /*offsetIndex*/ 2) step_changes.i = /*offsetIndex*/ ctx[1] + /*i*/ ctx[6];
    			if (dirty & /*cellSize*/ 1) step_changes.cellSize = /*cellSize*/ ctx[0];
    			step.$set(step_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(step.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(step.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(step, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(11:8) {#each Array(6) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*color*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "flex flex-nowrap flex-" + /*flexDirection*/ ctx[2]);
    			add_location(div, file$7, 8, 0, 172);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*flexDirection*/ 4 && div_class_value !== (div_class_value = "flex flex-nowrap flex-" + /*flexDirection*/ ctx[2])) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Walkway', slots, []);
    	let { cellSize, offsetIndex } = $$props;
    	let { flexDirection = "row" } = $$props;
    	let { color = null } = $$props;
    	const writable_props = ['cellSize', 'offsetIndex', 'flexDirection', 'color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Walkway> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('cellSize' in $$props) $$invalidate(0, cellSize = $$props.cellSize);
    		if ('offsetIndex' in $$props) $$invalidate(1, offsetIndex = $$props.offsetIndex);
    		if ('flexDirection' in $$props) $$invalidate(2, flexDirection = $$props.flexDirection);
    		if ('color' in $$props) $$invalidate(3, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		Step,
    		cellSize,
    		offsetIndex,
    		flexDirection,
    		color
    	});

    	$$self.$inject_state = $$props => {
    		if ('cellSize' in $$props) $$invalidate(0, cellSize = $$props.cellSize);
    		if ('offsetIndex' in $$props) $$invalidate(1, offsetIndex = $$props.offsetIndex);
    		if ('flexDirection' in $$props) $$invalidate(2, flexDirection = $$props.flexDirection);
    		if ('color' in $$props) $$invalidate(3, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cellSize, offsetIndex, flexDirection, color];
    }

    class Walkway extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			cellSize: 0,
    			offsetIndex: 1,
    			flexDirection: 2,
    			color: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Walkway",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cellSize*/ ctx[0] === undefined && !('cellSize' in props)) {
    			console.warn("<Walkway> was created without expected prop 'cellSize'");
    		}

    		if (/*offsetIndex*/ ctx[1] === undefined && !('offsetIndex' in props)) {
    			console.warn("<Walkway> was created without expected prop 'offsetIndex'");
    		}
    	}

    	get cellSize() {
    		throw new Error("<Walkway>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cellSize(value) {
    		throw new Error("<Walkway>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offsetIndex() {
    		throw new Error("<Walkway>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offsetIndex(value) {
    		throw new Error("<Walkway>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flexDirection() {
    		throw new Error("<Walkway>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flexDirection(value) {
    		throw new Error("<Walkway>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Walkway>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Walkway>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\board\Triangle.svelte generated by Svelte v3.44.3 */

    const file$6 = "src\\components\\board\\Triangle.svelte";

    function create_fragment$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "triangle svelte-1n4h48y");
    			set_style(div, "background-color", "var(--" + /*color*/ ctx[0] + "-player)");
    			set_style(div, "height", /*gameHomeSize*/ ctx[1] / 2 + "px");
    			set_style(div, "width", /*gameHomeSize*/ ctx[1] + "px");
    			set_style(div, "margin-top", /*top*/ ctx[3] + "px");
    			set_style(div, "margin-right", /*right*/ ctx[4] + "px");
    			set_style(div, "margin-left", /*left*/ ctx[5] + "px");
    			set_style(div, "margin-bottom", /*bottom*/ ctx[6] + "px");
    			set_style(div, "--rotate", /*i*/ ctx[2] * 90 + "deg");
    			add_location(div, file$6, 5, 0, 121);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				set_style(div, "background-color", "var(--" + /*color*/ ctx[0] + "-player)");
    			}

    			if (dirty & /*gameHomeSize*/ 2) {
    				set_style(div, "height", /*gameHomeSize*/ ctx[1] / 2 + "px");
    			}

    			if (dirty & /*gameHomeSize*/ 2) {
    				set_style(div, "width", /*gameHomeSize*/ ctx[1] + "px");
    			}

    			if (dirty & /*top*/ 8) {
    				set_style(div, "margin-top", /*top*/ ctx[3] + "px");
    			}

    			if (dirty & /*right*/ 16) {
    				set_style(div, "margin-right", /*right*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 32) {
    				set_style(div, "margin-left", /*left*/ ctx[5] + "px");
    			}

    			if (dirty & /*bottom*/ 64) {
    				set_style(div, "margin-bottom", /*bottom*/ ctx[6] + "px");
    			}

    			if (dirty & /*i*/ 4) {
    				set_style(div, "--rotate", /*i*/ ctx[2] * 90 + "deg");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Triangle', slots, []);
    	let { color, gameHomeSize, i } = $$props;
    	let { top = 0, right = 0, left = 0, bottom = 0 } = $$props;
    	const writable_props = ['color', 'gameHomeSize', 'i', 'top', 'right', 'left', 'bottom'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Triangle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('gameHomeSize' in $$props) $$invalidate(1, gameHomeSize = $$props.gameHomeSize);
    		if ('i' in $$props) $$invalidate(2, i = $$props.i);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('right' in $$props) $$invalidate(4, right = $$props.right);
    		if ('left' in $$props) $$invalidate(5, left = $$props.left);
    		if ('bottom' in $$props) $$invalidate(6, bottom = $$props.bottom);
    	};

    	$$self.$capture_state = () => ({
    		color,
    		gameHomeSize,
    		i,
    		top,
    		right,
    		left,
    		bottom
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('gameHomeSize' in $$props) $$invalidate(1, gameHomeSize = $$props.gameHomeSize);
    		if ('i' in $$props) $$invalidate(2, i = $$props.i);
    		if ('top' in $$props) $$invalidate(3, top = $$props.top);
    		if ('right' in $$props) $$invalidate(4, right = $$props.right);
    		if ('left' in $$props) $$invalidate(5, left = $$props.left);
    		if ('bottom' in $$props) $$invalidate(6, bottom = $$props.bottom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, gameHomeSize, i, top, right, left, bottom];
    }

    class Triangle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			color: 0,
    			gameHomeSize: 1,
    			i: 2,
    			top: 3,
    			right: 4,
    			left: 5,
    			bottom: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Triangle",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*color*/ ctx[0] === undefined && !('color' in props)) {
    			console.warn("<Triangle> was created without expected prop 'color'");
    		}

    		if (/*gameHomeSize*/ ctx[1] === undefined && !('gameHomeSize' in props)) {
    			console.warn("<Triangle> was created without expected prop 'gameHomeSize'");
    		}

    		if (/*i*/ ctx[2] === undefined && !('i' in props)) {
    			console.warn("<Triangle> was created without expected prop 'i'");
    		}
    	}

    	get color() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gameHomeSize() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameHomeSize(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Triangle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Triangle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\board\Index.svelte generated by Svelte v3.44.3 */
    const file$5 = "src\\components\\board\\Index.svelte";

    function create_fragment$5(ctx) {
    	let div9;
    	let div8;
    	let div7;
    	let div0;
    	let prison0;
    	let t0;
    	let walkway0;
    	let t1;
    	let walkway1;
    	let t2;
    	let walkway2;
    	let t3;
    	let prison1;
    	let t4;
    	let div5;
    	let div1;
    	let walkway3;
    	let t5;
    	let walkway4;
    	let t6;
    	let walkway5;
    	let t7;
    	let div3;
    	let div2;
    	let triangle0;
    	let t8;
    	let triangle1;
    	let t9;
    	let triangle2;
    	let t10;
    	let triangle3;
    	let t11;
    	let div4;
    	let walkway6;
    	let t12;
    	let walkway7;
    	let t13;
    	let walkway8;
    	let t14;
    	let div6;
    	let prison2;
    	let t15;
    	let walkway9;
    	let t16;
    	let walkway10;
    	let t17;
    	let walkway11;
    	let t18;
    	let prison3;
    	let current;

    	prison0 = new Prison({
    			props: {
    				code: "red",
    				cellSize: /*cellSize*/ ctx[1],
    				prisonSize: /*prisonSize*/ ctx[2]
    			},
    			$$inline: true
    		});

    	walkway0 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 1,
    				flexDirection: "column"
    			},
    			$$inline: true
    		});

    	walkway1 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 7,
    				flexDirection: "column",
    				color: "blue"
    			},
    			$$inline: true
    		});

    	walkway2 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 13,
    				flexDirection: "column"
    			},
    			$$inline: true
    		});

    	prison1 = new Prison({
    			props: {
    				code: "blue",
    				cellSize: /*cellSize*/ ctx[1],
    				prisonSize: /*prisonSize*/ ctx[2]
    			},
    			$$inline: true
    		});

    	walkway3 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 19
    			},
    			$$inline: true
    		});

    	walkway4 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 25,
    				color: "red"
    			},
    			$$inline: true
    		});

    	walkway5 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 31
    			},
    			$$inline: true
    		});

    	triangle0 = new Triangle({
    			props: {
    				color: "green",
    				i: 0,
    				top: /*gameHomeSize*/ ctx[3] / 2,
    				gameHomeSize: /*gameHomeSize*/ ctx[3]
    			},
    			$$inline: true
    		});

    	triangle1 = new Triangle({
    			props: {
    				color: "red",
    				i: 1,
    				top: /*gameHomeSize*/ ctx[3] / 4,
    				left: -/*gameHomeSize*/ ctx[3] / 4,
    				gameHomeSize: /*gameHomeSize*/ ctx[3]
    			},
    			$$inline: true
    		});

    	triangle2 = new Triangle({
    			props: {
    				color: "blue",
    				i: 2,
    				gameHomeSize: /*gameHomeSize*/ ctx[3]
    			},
    			$$inline: true
    		});

    	triangle3 = new Triangle({
    			props: {
    				color: "yellow",
    				i: 3,
    				top: /*gameHomeSize*/ ctx[3] / 4,
    				left: /*gameHomeSize*/ ctx[3] / 4,
    				gameHomeSize: /*gameHomeSize*/ ctx[3]
    			},
    			$$inline: true
    		});

    	walkway6 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 37,
    				flexDirection: "row-r"
    			},
    			$$inline: true
    		});

    	walkway7 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 43,
    				flexDirection: "row-r",
    				color: "yellow"
    			},
    			$$inline: true
    		});

    	walkway8 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 49,
    				flexDirection: "row-r"
    			},
    			$$inline: true
    		});

    	prison2 = new Prison({
    			props: {
    				code: "green",
    				cellSize: /*cellSize*/ ctx[1],
    				prisonSize: /*prisonSize*/ ctx[2]
    			},
    			$$inline: true
    		});

    	walkway9 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 55,
    				flexDirection: "column-r"
    			},
    			$$inline: true
    		});

    	walkway10 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 61,
    				flexDirection: "column-r",
    				color: "green"
    			},
    			$$inline: true
    		});

    	walkway11 = new Walkway({
    			props: {
    				cellSize: /*cellSize*/ ctx[1],
    				offsetIndex: 67,
    				flexDirection: "column-r"
    			},
    			$$inline: true
    		});

    	prison3 = new Prison({
    			props: {
    				code: "yellow",
    				cellSize: /*cellSize*/ ctx[1],
    				prisonSize: /*prisonSize*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			create_component(prison0.$$.fragment);
    			t0 = space();
    			create_component(walkway0.$$.fragment);
    			t1 = space();
    			create_component(walkway1.$$.fragment);
    			t2 = space();
    			create_component(walkway2.$$.fragment);
    			t3 = space();
    			create_component(prison1.$$.fragment);
    			t4 = space();
    			div5 = element("div");
    			div1 = element("div");
    			create_component(walkway3.$$.fragment);
    			t5 = space();
    			create_component(walkway4.$$.fragment);
    			t6 = space();
    			create_component(walkway5.$$.fragment);
    			t7 = space();
    			div3 = element("div");
    			div2 = element("div");
    			create_component(triangle0.$$.fragment);
    			t8 = space();
    			create_component(triangle1.$$.fragment);
    			t9 = space();
    			create_component(triangle2.$$.fragment);
    			t10 = space();
    			create_component(triangle3.$$.fragment);
    			t11 = space();
    			div4 = element("div");
    			create_component(walkway6.$$.fragment);
    			t12 = space();
    			create_component(walkway7.$$.fragment);
    			t13 = space();
    			create_component(walkway8.$$.fragment);
    			t14 = space();
    			div6 = element("div");
    			create_component(prison2.$$.fragment);
    			t15 = space();
    			create_component(walkway9.$$.fragment);
    			t16 = space();
    			create_component(walkway10.$$.fragment);
    			t17 = space();
    			create_component(walkway11.$$.fragment);
    			t18 = space();
    			create_component(prison3.$$.fragment);
    			attr_dev(div0, "class", "flex flex-nowrap");
    			add_location(div0, file$5, 38, 12, 1091);
    			add_location(div1, file$5, 52, 16, 1684);
    			set_style(div2, "z-index", "6");
    			add_location(div2, file$5, 62, 20, 2120);
    			set_style(div3, "width", /*gameHomeSize*/ ctx[3] + "px");
    			attr_dev(div3, "class", "game-home svelte-18xkrso");
    			add_location(div3, file$5, 61, 16, 2042);
    			add_location(div4, file$5, 70, 16, 2622);
    			attr_dev(div5, "class", "flex flex-nowrap");
    			add_location(div5, file$5, 51, 12, 1636);
    			attr_dev(div6, "class", "flex flex-nowrap");
    			add_location(div6, file$5, 80, 12, 3065);
    			attr_dev(div7, "class", "board-inner w-full");
    			add_location(div7, file$5, 37, 8, 1045);
    			attr_dev(div8, "class", "board w-full h-full svelte-18xkrso");
    			add_location(div8, file$5, 36, 4, 1002);
    			attr_dev(div9, "class", "board-wrapper svelte-18xkrso");
    			set_style(div9, "--board-width", /*minSide*/ ctx[0] + "px");
    			set_style(div9, "--board-height", /*minSide*/ ctx[0] + "px");
    			set_style(div9, "--cell-size", /*cellSize*/ ctx[1] + "px");
    			add_location(div9, file$5, 28, 0, 828);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			mount_component(prison0, div0, null);
    			append_dev(div0, t0);
    			mount_component(walkway0, div0, null);
    			append_dev(div0, t1);
    			mount_component(walkway1, div0, null);
    			append_dev(div0, t2);
    			mount_component(walkway2, div0, null);
    			append_dev(div0, t3);
    			mount_component(prison1, div0, null);
    			append_dev(div7, t4);
    			append_dev(div7, div5);
    			append_dev(div5, div1);
    			mount_component(walkway3, div1, null);
    			append_dev(div1, t5);
    			mount_component(walkway4, div1, null);
    			append_dev(div1, t6);
    			mount_component(walkway5, div1, null);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			mount_component(triangle0, div2, null);
    			append_dev(div2, t8);
    			mount_component(triangle1, div2, null);
    			append_dev(div2, t9);
    			mount_component(triangle2, div2, null);
    			append_dev(div2, t10);
    			mount_component(triangle3, div2, null);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			mount_component(walkway6, div4, null);
    			append_dev(div4, t12);
    			mount_component(walkway7, div4, null);
    			append_dev(div4, t13);
    			mount_component(walkway8, div4, null);
    			append_dev(div7, t14);
    			append_dev(div7, div6);
    			mount_component(prison2, div6, null);
    			append_dev(div6, t15);
    			mount_component(walkway9, div6, null);
    			append_dev(div6, t16);
    			mount_component(walkway10, div6, null);
    			append_dev(div6, t17);
    			mount_component(walkway11, div6, null);
    			append_dev(div6, t18);
    			mount_component(prison3, div6, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const prison0_changes = {};
    			if (dirty & /*cellSize*/ 2) prison0_changes.cellSize = /*cellSize*/ ctx[1];
    			if (dirty & /*prisonSize*/ 4) prison0_changes.prisonSize = /*prisonSize*/ ctx[2];
    			prison0.$set(prison0_changes);
    			const walkway0_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway0_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway0.$set(walkway0_changes);
    			const walkway1_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway1_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway1.$set(walkway1_changes);
    			const walkway2_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway2_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway2.$set(walkway2_changes);
    			const prison1_changes = {};
    			if (dirty & /*cellSize*/ 2) prison1_changes.cellSize = /*cellSize*/ ctx[1];
    			if (dirty & /*prisonSize*/ 4) prison1_changes.prisonSize = /*prisonSize*/ ctx[2];
    			prison1.$set(prison1_changes);
    			const walkway3_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway3_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway3.$set(walkway3_changes);
    			const walkway4_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway4_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway4.$set(walkway4_changes);
    			const walkway5_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway5_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway5.$set(walkway5_changes);
    			const triangle0_changes = {};
    			if (dirty & /*gameHomeSize*/ 8) triangle0_changes.top = /*gameHomeSize*/ ctx[3] / 2;
    			if (dirty & /*gameHomeSize*/ 8) triangle0_changes.gameHomeSize = /*gameHomeSize*/ ctx[3];
    			triangle0.$set(triangle0_changes);
    			const triangle1_changes = {};
    			if (dirty & /*gameHomeSize*/ 8) triangle1_changes.top = /*gameHomeSize*/ ctx[3] / 4;
    			if (dirty & /*gameHomeSize*/ 8) triangle1_changes.left = -/*gameHomeSize*/ ctx[3] / 4;
    			if (dirty & /*gameHomeSize*/ 8) triangle1_changes.gameHomeSize = /*gameHomeSize*/ ctx[3];
    			triangle1.$set(triangle1_changes);
    			const triangle2_changes = {};
    			if (dirty & /*gameHomeSize*/ 8) triangle2_changes.gameHomeSize = /*gameHomeSize*/ ctx[3];
    			triangle2.$set(triangle2_changes);
    			const triangle3_changes = {};
    			if (dirty & /*gameHomeSize*/ 8) triangle3_changes.top = /*gameHomeSize*/ ctx[3] / 4;
    			if (dirty & /*gameHomeSize*/ 8) triangle3_changes.left = /*gameHomeSize*/ ctx[3] / 4;
    			if (dirty & /*gameHomeSize*/ 8) triangle3_changes.gameHomeSize = /*gameHomeSize*/ ctx[3];
    			triangle3.$set(triangle3_changes);

    			if (!current || dirty & /*gameHomeSize*/ 8) {
    				set_style(div3, "width", /*gameHomeSize*/ ctx[3] + "px");
    			}

    			const walkway6_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway6_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway6.$set(walkway6_changes);
    			const walkway7_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway7_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway7.$set(walkway7_changes);
    			const walkway8_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway8_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway8.$set(walkway8_changes);
    			const prison2_changes = {};
    			if (dirty & /*cellSize*/ 2) prison2_changes.cellSize = /*cellSize*/ ctx[1];
    			if (dirty & /*prisonSize*/ 4) prison2_changes.prisonSize = /*prisonSize*/ ctx[2];
    			prison2.$set(prison2_changes);
    			const walkway9_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway9_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway9.$set(walkway9_changes);
    			const walkway10_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway10_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway10.$set(walkway10_changes);
    			const walkway11_changes = {};
    			if (dirty & /*cellSize*/ 2) walkway11_changes.cellSize = /*cellSize*/ ctx[1];
    			walkway11.$set(walkway11_changes);
    			const prison3_changes = {};
    			if (dirty & /*cellSize*/ 2) prison3_changes.cellSize = /*cellSize*/ ctx[1];
    			if (dirty & /*prisonSize*/ 4) prison3_changes.prisonSize = /*prisonSize*/ ctx[2];
    			prison3.$set(prison3_changes);

    			if (!current || dirty & /*minSide*/ 1) {
    				set_style(div9, "--board-width", /*minSide*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*minSide*/ 1) {
    				set_style(div9, "--board-height", /*minSide*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*cellSize*/ 2) {
    				set_style(div9, "--cell-size", /*cellSize*/ ctx[1] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prison0.$$.fragment, local);
    			transition_in(walkway0.$$.fragment, local);
    			transition_in(walkway1.$$.fragment, local);
    			transition_in(walkway2.$$.fragment, local);
    			transition_in(prison1.$$.fragment, local);
    			transition_in(walkway3.$$.fragment, local);
    			transition_in(walkway4.$$.fragment, local);
    			transition_in(walkway5.$$.fragment, local);
    			transition_in(triangle0.$$.fragment, local);
    			transition_in(triangle1.$$.fragment, local);
    			transition_in(triangle2.$$.fragment, local);
    			transition_in(triangle3.$$.fragment, local);
    			transition_in(walkway6.$$.fragment, local);
    			transition_in(walkway7.$$.fragment, local);
    			transition_in(walkway8.$$.fragment, local);
    			transition_in(prison2.$$.fragment, local);
    			transition_in(walkway9.$$.fragment, local);
    			transition_in(walkway10.$$.fragment, local);
    			transition_in(walkway11.$$.fragment, local);
    			transition_in(prison3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prison0.$$.fragment, local);
    			transition_out(walkway0.$$.fragment, local);
    			transition_out(walkway1.$$.fragment, local);
    			transition_out(walkway2.$$.fragment, local);
    			transition_out(prison1.$$.fragment, local);
    			transition_out(walkway3.$$.fragment, local);
    			transition_out(walkway4.$$.fragment, local);
    			transition_out(walkway5.$$.fragment, local);
    			transition_out(triangle0.$$.fragment, local);
    			transition_out(triangle1.$$.fragment, local);
    			transition_out(triangle2.$$.fragment, local);
    			transition_out(triangle3.$$.fragment, local);
    			transition_out(walkway6.$$.fragment, local);
    			transition_out(walkway7.$$.fragment, local);
    			transition_out(walkway8.$$.fragment, local);
    			transition_out(prison2.$$.fragment, local);
    			transition_out(walkway9.$$.fragment, local);
    			transition_out(walkway10.$$.fragment, local);
    			transition_out(walkway11.$$.fragment, local);
    			transition_out(prison3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_component(prison0);
    			destroy_component(walkway0);
    			destroy_component(walkway1);
    			destroy_component(walkway2);
    			destroy_component(prison1);
    			destroy_component(walkway3);
    			destroy_component(walkway4);
    			destroy_component(walkway5);
    			destroy_component(triangle0);
    			destroy_component(triangle1);
    			destroy_component(triangle2);
    			destroy_component(triangle3);
    			destroy_component(walkway6);
    			destroy_component(walkway7);
    			destroy_component(walkway8);
    			destroy_component(prison2);
    			destroy_component(walkway9);
    			destroy_component(walkway10);
    			destroy_component(walkway11);
    			destroy_component(prison3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Index', slots, []);
    	let minSide, cellSize, prisonSize, gameHomeSize;

    	function setCSSDimensions() {
    		let wrapElement = document.getElementById('wrap');
    		$$invalidate(0, minSide = Math.min(wrapElement.clientHeight, wrapElement.clientWidth));
    	}

    	onMount(() => {
    		setCSSDimensions();
    		engine.onWindowLoad();
    		window.addEventListener('resize', setCSSDimensions);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Prison,
    		Walkway,
    		Triangle,
    		engine,
    		minSide,
    		cellSize,
    		prisonSize,
    		gameHomeSize,
    		setCSSDimensions
    	});

    	$$self.$inject_state = $$props => {
    		if ('minSide' in $$props) $$invalidate(0, minSide = $$props.minSide);
    		if ('cellSize' in $$props) $$invalidate(1, cellSize = $$props.cellSize);
    		if ('prisonSize' in $$props) $$invalidate(2, prisonSize = $$props.prisonSize);
    		if ('gameHomeSize' in $$props) $$invalidate(3, gameHomeSize = $$props.gameHomeSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*minSide, cellSize*/ 3) {
    			{
    				$$invalidate(1, cellSize = (minSide - 70) / 15);
    				$$invalidate(2, prisonSize = 6 * cellSize + 24);

    				// walkwayWidth = cellSize + 4;
    				$$invalidate(3, gameHomeSize = cellSize * 3 + 8);
    			}
    		}
    	};

    	return [minSide, cellSize, prisonSize, gameHomeSize];
    }

    class Index$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\playerTab\Index.svelte generated by Svelte v3.44.3 */
    const file$4 = "src\\components\\playerTab\\Index.svelte";

    // (20:0) {#if !player.isNull}
    function create_if_block$4(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let input_value_value;
    	let input_readonly_value;
    	let t0;
    	let div1;
    	let p0;
    	let t1_value = /*player*/ ctx[4].type.toProperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t4;
    	let p2;
    	let t5_value = /*player*/ ctx[4].coinsOutside + "";
    	let t5;
    	let br0;
    	let t6;
    	let p3;
    	let t8;
    	let p4;
    	let t9_value = /*player*/ ctx[4].coinsAtPrison + "";
    	let t9;
    	let br1;
    	let t10;
    	let p5;
    	let t12;
    	let p6;
    	let t13_value = /*player*/ ctx[4].coinsReached + "";
    	let t13;
    	let br2;
    	let t14;
    	let p7;
    	let t16;
    	let p8;
    	let t17_value = /*player*/ ctx[4].kills + "";
    	let t17;
    	let br3;
    	let t18;
    	let t19;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*ended*/ ctx[2] && create_if_block_2$1(ctx);
    	let if_block1 = /*player*/ ctx[4].rank && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Coins Outside:";
    			t4 = space();
    			p2 = element("p");
    			t5 = text(t5_value);
    			br0 = element("br");
    			t6 = space();
    			p3 = element("p");
    			p3.textContent = "Coins At Prison:";
    			t8 = space();
    			p4 = element("p");
    			t9 = text(t9_value);
    			br1 = element("br");
    			t10 = space();
    			p5 = element("p");
    			p5.textContent = "Coins Reached:";
    			t12 = space();
    			p6 = element("p");
    			t13 = text(t13_value);
    			br2 = element("br");
    			t14 = space();
    			p7 = element("p");
    			p7.textContent = "Kills:";
    			t16 = space();
    			p8 = element("p");
    			t17 = text(t17_value);
    			br3 = element("br");
    			t18 = space();
    			if (if_block0) if_block0.c();
    			t19 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(input, "class", "player-input svelte-1aec7b6");
    			attr_dev(input, "type", "text");
    			input.value = input_value_value = /*player*/ ctx[4].name.slice(0, 10);
    			input.readOnly = input_readonly_value = !/*editable*/ ctx[3];
    			add_location(input, file$4, 22, 12, 682);
    			attr_dev(div0, "class", "head");
    			set_style(div0, "background-color", "var(--" + /*color*/ ctx[0] + "-player)");
    			add_location(div0, file$4, 21, 8, 601);
    			attr_dev(p0, "class", "sub-label type svelte-1aec7b6");
    			set_style(p0, "color", "var(--" + /*color*/ ctx[0] + "-player)");
    			add_location(p0, file$4, 37, 12, 1166);
    			attr_dev(p1, "class", "inline-block strong svelte-1aec7b6");
    			add_location(p1, file$4, 39, 12, 1277);
    			attr_dev(p2, "class", "inline-block svelte-1aec7b6");
    			add_location(p2, file$4, 40, 12, 1341);
    			add_location(br0, file$4, 40, 61, 1390);
    			attr_dev(p3, "class", "inline-block strong svelte-1aec7b6");
    			add_location(p3, file$4, 42, 12, 1411);
    			attr_dev(p4, "class", "inline-block svelte-1aec7b6");
    			add_location(p4, file$4, 43, 12, 1477);
    			add_location(br1, file$4, 43, 62, 1527);
    			attr_dev(p5, "class", "inline-block strong svelte-1aec7b6");
    			add_location(p5, file$4, 45, 12, 1548);
    			attr_dev(p6, "class", "inline-block svelte-1aec7b6");
    			add_location(p6, file$4, 46, 12, 1612);
    			add_location(br2, file$4, 46, 61, 1661);
    			attr_dev(p7, "class", "inline-block strong svelte-1aec7b6");
    			add_location(p7, file$4, 48, 12, 1682);
    			attr_dev(p8, "class", "inline-block svelte-1aec7b6");
    			add_location(p8, file$4, 49, 12, 1738);
    			add_location(br3, file$4, 49, 54, 1780);
    			attr_dev(div1, "class", "foot");
    			add_location(div1, file$4, 36, 8, 1134);
    			attr_dev(div2, "class", "player-tab svelte-1aec7b6");
    			add_location(div2, file$4, 20, 4, 567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(div1, t4);
    			append_dev(div1, p2);
    			append_dev(p2, t5);
    			append_dev(div1, br0);
    			append_dev(div1, t6);
    			append_dev(div1, p3);
    			append_dev(div1, t8);
    			append_dev(div1, p4);
    			append_dev(p4, t9);
    			append_dev(div1, br1);
    			append_dev(div1, t10);
    			append_dev(div1, p5);
    			append_dev(div1, t12);
    			append_dev(div1, p6);
    			append_dev(p6, t13);
    			append_dev(div1, br2);
    			append_dev(div1, t14);
    			append_dev(div1, p7);
    			append_dev(div1, t16);
    			append_dev(div1, p8);
    			append_dev(p8, t17);
    			append_dev(div1, br3);
    			append_dev(div1, t18);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t19);
    			if (if_block1) if_block1.m(div1, null);

    			if (!mounted) {
    				dispose = listen_dev(input, "blur", /*blur_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*player*/ 16 && input_value_value !== (input_value_value = /*player*/ ctx[4].name.slice(0, 10)) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*editable*/ 8 && input_readonly_value !== (input_readonly_value = !/*editable*/ ctx[3])) {
    				prop_dev(input, "readOnly", input_readonly_value);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div0, "background-color", "var(--" + /*color*/ ctx[0] + "-player)");
    			}

    			if (dirty & /*player*/ 16 && t1_value !== (t1_value = /*player*/ ctx[4].type.toProperCase() + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*color*/ 1) {
    				set_style(p0, "color", "var(--" + /*color*/ ctx[0] + "-player)");
    			}

    			if (dirty & /*player*/ 16 && t5_value !== (t5_value = /*player*/ ctx[4].coinsOutside + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*player*/ 16 && t9_value !== (t9_value = /*player*/ ctx[4].coinsAtPrison + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*player*/ 16 && t13_value !== (t13_value = /*player*/ ctx[4].coinsReached + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*player*/ 16 && t17_value !== (t17_value = /*player*/ ctx[4].kills + "")) set_data_dev(t17, t17_value);

    			if (!/*ended*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t19);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*player*/ ctx[4].rank) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(20:0) {#if !player.isNull}",
    		ctx
    	});

    	return block;
    }

    // (52:12) {#if !ended}
    function create_if_block_2$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*started*/ ctx[1] && /*editable*/ ctx[3]) return create_if_block_3;
    		if (/*isTurn*/ ctx[5]) return create_if_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(52:12) {#if !ended}",
    		ctx
    	});

    	return block;
    }

    // (55:33) 
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "CURRENT TURN";
    			attr_dev(p, "class", "sub-label svelte-1aec7b6");
    			add_location(p, file$4, 55, 20, 2016);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(55:33) ",
    		ctx
    	});

    	return block;
    }

    // (53:16) {#if !started && editable}
    function create_if_block_3(ctx) {
    	let a;
    	let t0;
    	let t1_value = /*player*/ ctx[4].type.toProperCase() + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text("Remove ");
    			t1 = text(t1_value);
    			t2 = text("?");
    			attr_dev(a, "href", "#wrap");
    			add_location(a, file$4, 53, 20, 1879);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*removePlayer*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*player*/ 16 && t1_value !== (t1_value = /*player*/ ctx[4].type.toProperCase() + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(53:16) {#if !started && editable}",
    		ctx
    	});

    	return block;
    }

    // (60:12) {#if player.rank}
    function create_if_block_1$2(ctx) {
    	let p;
    	let t0_value = nthString(/*player*/ ctx[4].rank) + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(" Place");
    			attr_dev(p, "class", "sub-label svelte-1aec7b6");
    			add_location(p, file$4, 60, 16, 2146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*player*/ 16 && t0_value !== (t0_value = nthString(/*player*/ ctx[4].rank) + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(60:12) {#if player.rank}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let if_block = !/*player*/ ctx[4].isNull && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*player*/ ctx[4].isNull) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Index', slots, []);
    	let { color, started, ended } = $$props;
    	let { editable = true } = $$props;
    	let player = engine.players[color];
    	let isTurn = false;

    	if (editable) {
    		engine.on(`${color}Update`, () => $$invalidate(4, player = engine.players[color]));
    		engine.on(`turn`, turnColor => $$invalidate(5, isTurn = turnColor == color));
    	}

    	function removePlayer() {
    		if (!engine.deletePlayer(color)) engine.alert('You cannot remove yourself from the game!');
    	}

    	const writable_props = ['color', 'started', 'ended', 'editable'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	const blur_handler = e => {
    		if (editable) {
    			engine.updatePlayerName(color, e.target.value);
    			engine.alert('Name updated', 1000);
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('started' in $$props) $$invalidate(1, started = $$props.started);
    		if ('ended' in $$props) $$invalidate(2, ended = $$props.ended);
    		if ('editable' in $$props) $$invalidate(3, editable = $$props.editable);
    	};

    	$$self.$capture_state = () => ({
    		engine,
    		nthString,
    		color,
    		started,
    		ended,
    		editable,
    		player,
    		isTurn,
    		removePlayer
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('started' in $$props) $$invalidate(1, started = $$props.started);
    		if ('ended' in $$props) $$invalidate(2, ended = $$props.ended);
    		if ('editable' in $$props) $$invalidate(3, editable = $$props.editable);
    		if ('player' in $$props) $$invalidate(4, player = $$props.player);
    		if ('isTurn' in $$props) $$invalidate(5, isTurn = $$props.isTurn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, started, ended, editable, player, isTurn, removePlayer, blur_handler];
    }

    class Index$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			color: 0,
    			started: 1,
    			ended: 2,
    			editable: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*color*/ ctx[0] === undefined && !('color' in props)) {
    			console.warn("<Index> was created without expected prop 'color'");
    		}

    		if (/*started*/ ctx[1] === undefined && !('started' in props)) {
    			console.warn("<Index> was created without expected prop 'started'");
    		}

    		if (/*ended*/ ctx[2] === undefined && !('ended' in props)) {
    			console.warn("<Index> was created without expected prop 'ended'");
    		}
    	}

    	get color() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get started() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set started(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ended() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ended(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editable() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editable(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\playerTab\Add.svelte generated by Svelte v3.44.3 */
    const file$3 = "src\\components\\playerTab\\Add.svelte";

    // (13:0) {#if !started && toDisplay}
    function create_if_block$3(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let div1;
    	let a0;
    	let t3;
    	let a1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Add";
    			t1 = space();
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Add Player?";
    			t3 = space();
    			a1 = element("a");
    			a1.textContent = "Add Bot?";
    			attr_dev(h3, "class", "svelte-4moyru");
    			add_location(h3, file$3, 15, 12, 507);
    			attr_dev(div0, "class", "head");
    			set_style(div0, "background-color", "var(--dull-player)");
    			add_location(div0, file$3, 14, 8, 429);
    			attr_dev(a0, "href", "#wrap");
    			add_location(a0, file$3, 19, 12, 579);
    			attr_dev(a1, "href", "#wrap");
    			add_location(a1, file$3, 27, 12, 838);
    			attr_dev(div1, "class", "foot");
    			add_location(div1, file$3, 18, 8, 547);
    			attr_dev(div2, "class", "player-tab svelte-4moyru");
    			add_location(div2, file$3, 13, 4, 395);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t3);
    			append_dev(div1, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(13:0) {#if !started && toDisplay}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = !/*started*/ ctx[0] && /*toDisplay*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*started*/ ctx[0] && /*toDisplay*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Add', slots, []);
    	let { started } = $$props;
    	const updateToDislplay = () => $$invalidate(1, toDisplay = engine.playerCount != 4);
    	let toDisplay = engine.playerCount != 4;
    	engine.on('playerCountUpdate', updateToDislplay);
    	engine.on('end', updateToDislplay); // Sometimes it messes up in the "end" event.
    	const writable_props = ['started'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Add> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		if (!engine.createPlayer()) engine.alert('Player limit has been reached...');
    	};

    	const click_handler_1 = () => {
    		if (!engine.createPlayer(true)) engine.alert('Player limit has been reached...');
    	};

    	$$self.$$set = $$props => {
    		if ('started' in $$props) $$invalidate(0, started = $$props.started);
    	};

    	$$self.$capture_state = () => ({
    		engine,
    		started,
    		updateToDislplay,
    		toDisplay
    	});

    	$$self.$inject_state = $$props => {
    		if ('started' in $$props) $$invalidate(0, started = $$props.started);
    		if ('toDisplay' in $$props) $$invalidate(1, toDisplay = $$props.toDisplay);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [started, toDisplay, click_handler, click_handler_1];
    }

    class Add extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { started: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Add",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*started*/ ctx[0] === undefined && !('started' in props)) {
    			console.warn("<Add> was created without expected prop 'started'");
    		}
    	}

    	get started() {
    		throw new Error("<Add>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set started(value) {
    		throw new Error("<Add>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\result\Index.svelte generated by Svelte v3.44.3 */
    const file$2 = "src\\components\\result\\Index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (11:0) {#if displayResult}
    function create_if_block$2(ctx) {
    	let div0;
    	let t0;
    	let div2;
    	let h3;
    	let t2;
    	let t3;
    	let h5;
    	let t5;
    	let div1;
    	let t6;
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = engine.ranks.length && create_if_block_1$1(ctx);
    	let each_value = engine.ranks;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Result";
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			h5 = element("h5");
    			h5.textContent = "Rankings";
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			a = element("a");
    			a.textContent = "Close Tab";
    			attr_dev(div0, "class", "result-wrap svelte-1572n2l");
    			add_location(div0, file$2, 11, 4, 273);
    			attr_dev(h3, "class", "svelte-1572n2l");
    			add_location(h3, file$2, 13, 8, 339);
    			attr_dev(h5, "class", "svelte-1572n2l");
    			add_location(h5, file$2, 19, 8, 479);
    			attr_dev(div1, "class", "result-players-tab svelte-1572n2l");
    			add_location(div1, file$2, 20, 8, 506);
    			attr_dev(a, "href", "#wrap");
    			attr_dev(a, "class", "svelte-1572n2l");
    			add_location(a, file$2, 30, 8, 793);
    			attr_dev(div2, "class", "result-tab svelte-1572n2l");
    			add_location(div2, file$2, 12, 4, 305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h3);
    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t3);
    			append_dev(div2, h5);
    			append_dev(div2, t5);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t6);
    			append_dev(div2, a);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (engine.ranks.length) if_block.p(ctx, dirty);

    			if (dirty & /*engine, started*/ 1) {
    				each_value = engine.ranks;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(11:0) {#if displayResult}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {#if engine.ranks.length}
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `${engine.ranks[0].name} has won the game!`;
    			attr_dev(p, "class", "svelte-1572n2l");
    			add_location(p, file$2, 16, 12, 405);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(16:8) {#if engine.ranks.length}",
    		ctx
    	});

    	return block;
    }

    // (22:12) {#each engine.ranks as player}
    function create_each_block(ctx) {
    	let playertab;
    	let current;

    	playertab = new Index$1({
    			props: {
    				color: /*player*/ ctx[3].color,
    				editable: false,
    				started: /*started*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(playertab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(playertab, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const playertab_changes = {};
    			if (dirty & /*started*/ 1) playertab_changes.started = /*started*/ ctx[0];
    			playertab.$set(playertab_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playertab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playertab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(playertab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:12) {#each engine.ranks as player}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*displayResult*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*displayResult*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*displayResult*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Index', slots, []);
    	let { started } = $$props;
    	let displayResult = false;
    	engine.on('displayResult', () => $$invalidate(1, displayResult = true));
    	const writable_props = ['started'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, displayResult = false);

    	$$self.$$set = $$props => {
    		if ('started' in $$props) $$invalidate(0, started = $$props.started);
    	};

    	$$self.$capture_state = () => ({
    		PlayerTab: Index$1,
    		engine,
    		started,
    		displayResult
    	});

    	$$self.$inject_state = $$props => {
    		if ('started' in $$props) $$invalidate(0, started = $$props.started);
    		if ('displayResult' in $$props) $$invalidate(1, displayResult = $$props.displayResult);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [started, displayResult, click_handler];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { started: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*started*/ ctx[0] === undefined && !('started' in props)) {
    			console.warn("<Index> was created without expected prop 'started'");
    		}
    	}

    	get started() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set started(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\GamePage.svelte generated by Svelte v3.44.3 */
    const file$1 = "src\\GamePage.svelte";

    // (69:12) {:else}
    function create_else_block$1(ctx) {
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "Roll Dice";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Save Game";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "New Game";
    			attr_dev(a0, "class", "player-tab-btn svelte-1y8ugt6");
    			attr_dev(a0, "href", "#wrap");
    			add_location(a0, file$1, 69, 16, 2458);
    			attr_dev(a1, "class", "player-tab-btn svelte-1y8ugt6");
    			attr_dev(a1, "href", "#wrap");
    			add_location(a1, file$1, 75, 16, 2655);
    			attr_dev(a2, "class", "player-tab-btn svelte-1y8ugt6");
    			attr_dev(a2, "href", "#wrap");
    			add_location(a2, file$1, 81, 16, 2842);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler_2*/ ctx[6], false, false, false),
    					listen_dev(a1, "click", /*click_handler_3*/ ctx[7], false, false, false),
    					listen_dev(a2, "click", /*click_handler_4*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(69:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:12) {#if !started}
    function create_if_block_1(ctx) {
    	let a;
    	let t1;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = hasSaved && !/*ended*/ ctx[3] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "New Game";
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a, "class", "player-tab-btn svelte-1y8ugt6");
    			attr_dev(a, "href", "#wrap");
    			add_location(a, file$1, 51, 16, 1682);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (hasSaved && !/*ended*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(51:12) {#if !started}",
    		ctx
    	});

    	return block;
    }

    // (62:16) {#if hasSaved && !ended}
    function create_if_block_2(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Resume Game";
    			attr_dev(a, "class", "player-tab-btn svelte-1y8ugt6");
    			attr_dev(a, "href", "#wrap");
    			add_location(a, file$1, 62, 20, 2201);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(62:16) {#if hasSaved && !ended}",
    		ctx
    	});

    	return block;
    }

    // (94:12) {#if canDisplayResultBtn}
    function create_if_block$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Results";
    			attr_dev(a, "class", "player-tab-btn svelte-1y8ugt6");
    			attr_dev(a, "href", "#wrap");
    			add_location(a, file$1, 94, 16, 3329);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_5*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(94:12) {#if canDisplayResultBtn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let t0;
    	let result;
    	let t1;
    	let div4;
    	let board;
    	let t2;
    	let div3;
    	let div1;
    	let playertab0;
    	let t3;
    	let playertab1;
    	let t4;
    	let playertab2;
    	let t5;
    	let playertab3;
    	let t6;
    	let addplayer;
    	let t7;
    	let div2;
    	let t8;
    	let current;

    	result = new Index({
    			props: { started: /*started*/ ctx[2] },
    			$$inline: true
    		});

    	board = new Index$2({ $$inline: true });

    	playertab0 = new Index$1({
    			props: {
    				color: "red",
    				started: /*started*/ ctx[2],
    				ended: /*ended*/ ctx[3]
    			},
    			$$inline: true
    		});

    	playertab1 = new Index$1({
    			props: {
    				color: "yellow",
    				started: /*started*/ ctx[2],
    				ended: /*ended*/ ctx[3]
    			},
    			$$inline: true
    		});

    	playertab2 = new Index$1({
    			props: {
    				color: "blue",
    				started: /*started*/ ctx[2],
    				ended: /*ended*/ ctx[3]
    			},
    			$$inline: true
    		});

    	playertab3 = new Index$1({
    			props: {
    				color: "green",
    				started: /*started*/ ctx[2],
    				ended: /*ended*/ ctx[3]
    			},
    			$$inline: true
    		});

    	addplayer = new Add({
    			props: { started: /*started*/ ctx[2] },
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (!/*started*/ ctx[2]) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*canDisplayResultBtn*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			create_component(result.$$.fragment);
    			t1 = space();
    			div4 = element("div");
    			create_component(board.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			create_component(playertab0.$$.fragment);
    			t3 = space();
    			create_component(playertab1.$$.fragment);
    			t4 = space();
    			create_component(playertab2.$$.fragment);
    			t5 = space();
    			create_component(playertab3.$$.fragment);
    			t6 = space();
    			create_component(addplayer.$$.fragment);
    			t7 = space();
    			div2 = element("div");
    			if_block0.c();
    			t8 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "wrap svelte-1y8ugt6");
    			attr_dev(div0, "id", "wrap");
    			add_location(div0, file$1, 33, 0, 1122);
    			attr_dev(div1, "class", "flex flex-wrap");
    			add_location(div1, file$1, 41, 8, 1285);
    			attr_dev(div2, "class", "flex flex-wrap");
    			add_location(div2, file$1, 49, 8, 1608);
    			attr_dev(div3, "class", "players-tab svelte-1y8ugt6");
    			add_location(div3, file$1, 40, 4, 1250);
    			attr_dev(div4, "class", "flex svelte-1y8ugt6");
    			toggle_class(div4, "mobile-view", /*mobileView*/ ctx[0]);
    			add_location(div4, file$1, 37, 0, 1178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(result, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			mount_component(board, div4, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			mount_component(playertab0, div1, null);
    			append_dev(div1, t3);
    			mount_component(playertab1, div1, null);
    			append_dev(div1, t4);
    			mount_component(playertab2, div1, null);
    			append_dev(div1, t5);
    			mount_component(playertab3, div1, null);
    			append_dev(div1, t6);
    			mount_component(addplayer, div1, null);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			if_block0.m(div2, null);
    			append_dev(div2, t8);
    			if (if_block1) if_block1.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const result_changes = {};
    			if (dirty & /*started*/ 4) result_changes.started = /*started*/ ctx[2];
    			result.$set(result_changes);
    			const playertab0_changes = {};
    			if (dirty & /*started*/ 4) playertab0_changes.started = /*started*/ ctx[2];
    			if (dirty & /*ended*/ 8) playertab0_changes.ended = /*ended*/ ctx[3];
    			playertab0.$set(playertab0_changes);
    			const playertab1_changes = {};
    			if (dirty & /*started*/ 4) playertab1_changes.started = /*started*/ ctx[2];
    			if (dirty & /*ended*/ 8) playertab1_changes.ended = /*ended*/ ctx[3];
    			playertab1.$set(playertab1_changes);
    			const playertab2_changes = {};
    			if (dirty & /*started*/ 4) playertab2_changes.started = /*started*/ ctx[2];
    			if (dirty & /*ended*/ 8) playertab2_changes.ended = /*ended*/ ctx[3];
    			playertab2.$set(playertab2_changes);
    			const playertab3_changes = {};
    			if (dirty & /*started*/ 4) playertab3_changes.started = /*started*/ ctx[2];
    			if (dirty & /*ended*/ 8) playertab3_changes.ended = /*ended*/ ctx[3];
    			playertab3.$set(playertab3_changes);
    			const addplayer_changes = {};
    			if (dirty & /*started*/ 4) addplayer_changes.started = /*started*/ ctx[2];
    			addplayer.$set(addplayer_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div2, t8);
    				}
    			}

    			if (/*canDisplayResultBtn*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*mobileView*/ 1) {
    				toggle_class(div4, "mobile-view", /*mobileView*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(result.$$.fragment, local);
    			transition_in(board.$$.fragment, local);
    			transition_in(playertab0.$$.fragment, local);
    			transition_in(playertab1.$$.fragment, local);
    			transition_in(playertab2.$$.fragment, local);
    			transition_in(playertab3.$$.fragment, local);
    			transition_in(addplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(result.$$.fragment, local);
    			transition_out(board.$$.fragment, local);
    			transition_out(playertab0.$$.fragment, local);
    			transition_out(playertab1.$$.fragment, local);
    			transition_out(playertab2.$$.fragment, local);
    			transition_out(playertab3.$$.fragment, local);
    			transition_out(addplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			destroy_component(result, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			destroy_component(board);
    			destroy_component(playertab0);
    			destroy_component(playertab1);
    			destroy_component(playertab2);
    			destroy_component(playertab3);
    			destroy_component(addplayer);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GamePage', slots, []);
    	let mobileView = false;
    	let canDisplayResultBtn = false;
    	let started = engine.started;
    	let ended = engine.ended;
    	engine.on('start', () => $$invalidate(2, started = true));
    	engine.on('canDisplayResults', () => $$invalidate(1, canDisplayResultBtn = true));

    	engine.on('end', () => {
    		$$invalidate(1, canDisplayResultBtn = true);
    		$$invalidate(3, ended = true);
    		engine.emit('displayResult');
    	});

    	function gamePageResponsiveHandler() {
    		let wrapElement = document.getElementById('wrap');
    		$$invalidate(0, mobileView = wrapElement.clientWidth < wrapElement.clientHeight * 2);
    	}

    	onMount(() => {
    		gamePageResponsiveHandler();
    		window.addEventListener('resize', gamePageResponsiveHandler);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GamePage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = async () => {
    		if (hasSaved && !confirm('Are you sure? Your old game data might be deleted!')) return;
    		let success = await engine.start();
    		if (!success) engine.alert('Minimum two players are required.', 1000);
    	};

    	const click_handler_1 = () => engine.startFromSaved();
    	const click_handler_2 = () => engine.emit('diceRoll');
    	const click_handler_3 = () => engine.save();

    	const click_handler_4 = () => {
    		if (confirm('Are you sure? Your old game data might be deleted!')) {
    			engine.clearSaved();
    			window.location.href = "?game";
    		}
    	};

    	const click_handler_5 = () => engine.emit('displayResult');

    	$$self.$capture_state = () => ({
    		onMount,
    		Board: Index$2,
    		PlayerTab: Index$1,
    		AddPlayer: Add,
    		Result: Index,
    		engine,
    		hasSaved,
    		mobileView,
    		canDisplayResultBtn,
    		started,
    		ended,
    		gamePageResponsiveHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ('mobileView' in $$props) $$invalidate(0, mobileView = $$props.mobileView);
    		if ('canDisplayResultBtn' in $$props) $$invalidate(1, canDisplayResultBtn = $$props.canDisplayResultBtn);
    		if ('started' in $$props) $$invalidate(2, started = $$props.started);
    		if ('ended' in $$props) $$invalidate(3, ended = $$props.ended);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		mobileView,
    		canDisplayResultBtn,
    		started,
    		ended,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class GamePage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GamePage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.3 */
    const file = "src\\App.svelte";

    // (12:0) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let a0;
    	let t5;
    	let p1;
    	let t6;
    	let a1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Ludo";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "An awesome site to play ludo singleplayer for fun even with bots!";
    			t3 = space();
    			a0 = element("a");
    			a0.textContent = "Lets play!";
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Made by ");
    			a1 = element("a");
    			a1.textContent = "scientific-dev";
    			attr_dev(h1, "class", "m-0 svelte-1qrebkq");
    			add_location(h1, file, 13, 2, 257);
    			attr_dev(p0, "class", "m-0 svelte-1qrebkq");
    			add_location(p0, file, 14, 2, 286);
    			attr_dev(a0, "href", "?game");
    			attr_dev(a0, "class", "cover-btn svelte-1qrebkq");
    			add_location(a0, file, 16, 2, 376);
    			attr_dev(a1, "href", "https://github.com/scientific-dev");
    			attr_dev(a1, "class", "svelte-1qrebkq");
    			add_location(a1, file, 17, 33, 459);
    			attr_dev(p1, "class", "credits m-0 svelte-1qrebkq");
    			add_location(p1, file, 17, 2, 428);
    			attr_dev(div, "class", "cover svelte-1qrebkq");
    			add_location(div, file, 12, 1, 234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, a0);
    			append_dev(div, t5);
    			append_dev(div, p1);
    			append_dev(p1, t6);
    			append_dev(p1, a1);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(12:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:0) {#if isGame}
    function create_if_block(ctx) {
    	let gamepage;
    	let current;
    	gamepage = new GamePage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(gamepage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gamepage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamepage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamepage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gamepage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(10:0) {#if isGame}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isGame*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div, "class", "bg-cover svelte-1qrebkq");
    			add_location(div, file, 7, 0, 168);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const queries = new URLSearchParams(window.location.search);
    	let isGame = queries.has('game');
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ GamePage, queries, isGame });

    	$$self.$inject_state = $$props => {
    		if ('isGame' in $$props) $$invalidate(0, isGame = $$props.isGame);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isGame];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var main = new App({ target: document.body });

    return main;

})();
