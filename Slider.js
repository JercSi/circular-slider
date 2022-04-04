import {degToRad} from "./Utils.js";

const CIRCLE_IN_RADIANS = (Math.PI * 2); // Circle in radians
const DEFAULT_COLOR = "#FF00FF"; // Default (fallback) slider color
const NUMBER_FORMAT_LOCALES = 'en-US'; // Number format localization
const NUMBER_FORMAT_OPTIONS = {currency: 'USD', maximumFractionDigits: 0, style: 'currency'}; // Number format options

class CircleSlider {
    constructor(data = {}) {
        // Element selector
        if (undefined !== data?.selector) {
            // If selector is found then use it, otherwise use body
            this.selector = document.querySelector(data.selector) ?? document.getElementsByTagName("body");
        } else {
            // Use body when selector is not set
            this.selector = document.getElementsByTagName("body");
        }
        this.selector.classList.add("cs-slider");

        // List of slides
        this.slides = data?.slides ?? [];

        // SVG contaner
        this.height = 400;
        this.width = 400;

        // Events
        this.is_moving = false; // Is touch/mouse event active
        this.moving_index = null; // Which slider is moving
        this.almost_reached_max_value = false; // Has slider almost reached the end?
        this.almost_reached_min_value = false; // Has slider almost reached the start?

        try {
            // Run validation on slides properties
            this.validateSlides();
            // and radius between the slides
            this.validateRadius();

            // Get max radius, to expand the container sizes
            let max_radius = Math.max.apply(Math, this.slides.map(function(o) { return o.radius; })) * 2;
            if (max_radius > 370) {
                // Expand the container are and add additional 30px margin
                this.height = max_radius + 30;
                this.width = max_radius + 30;
            }

            // Creates slides and a legend
            this.createLegend();
            this.createSlides();
        } catch (error) {
            this.selector.classList.add("error");
            this.selector.innerHTML = error;
        }
    };

    /**
     * Calculate angle from current and max value
     * @param {number} min Min slide value
     * @param {number} max Max slide value
     * @param {number} current Current slide value
     * @returns {number} Angle in radians
     */
    calculateAngle = (min, max, current) => {
        // Use min and max value and current value to get fill percentage
        // Then multiply percenteg with circle (360deg)
        let angle = ((current - min) / (max - min)) * 360;

        // Conver angle to radians
        return degToRad(angle);
    };

    /**
     * Calculate angle between svg center point and cursor / touch.
     * @param {MouseEvent|TouchEvent} event 
     * @returns {number} Angle in radians
     */
    calculateNewAngle = (event) => {
        let point = {
            x: 0, 
            y: 0,
        };

        // Get coordinate where user clicked / touched
        if ("mousemove" === event.type) {
            point.x = event.clientX;
            point.y = event.clientY;
        } else if ("touchmove" === event.type) {
            point.x = event.touches[0].clientX;
            point.y = event.touches[0].clientY;
        }

        // Get the middle point of a slider
        let svg = document.querySelector(".cs-slides svg").getBoundingClientRect();
        let middle_point = {
            x: svg.left + (svg.width / 2),
            y: svg.top + (svg.height / 2),
        }

        let angle = Math.atan2(point.y - middle_point.y, point.x - middle_point.x);

        if (angle < 0) {
            // Angle is less than 0, add 360deg
            angle += CIRCLE_IN_RADIANS;
        }

        return angle;
    };

    /**
     * Calculate value from angle
     * @param {number} angle Angle in radians
     * @param {object} slide Slide details
     * @returns {number} Value
     */
    calculateValueFromAngle = (angle, slide) => {
        if (CIRCLE_IN_RADIANS === angle) {
            return slide.max;
        }

        // Number of steps with used angle
        let number_of_steps = Math.round(angle / slide.step_angle); 

        // Calculate the value
        return slide.min + (slide.step * number_of_steps);
    };

    /**
     * Create legend
     */
    createLegend = () => {
        let list = document.createElement("div");
        list.classList.add("cs-legend");

        this.slides.forEach((slide, index) => {
            if (undefined === slide?.value) {
                // Default value not defined, use minimum value
                this.slides[index].value = slide.min;
            }

            if (undefined === slide?.title) {
                // Title is not set
                this.slides[index].title = "Not set";
            }

            // Slide wrapper
            let list_item = document.createElement("div");
            list_item.classList.add("cs-legend-item");
            list_item.dataset.index = index;

            // Formatted value
            let element_value = document.createElement("div");
            element_value.classList.add('cs-legend-item--value');
            element_value.innerHTML = this.getFormattedValue(slide.value);

            // Color box
            let element_color = document.createElement("div");
            element_color.classList.add('cs-legend-item--color');
            element_color.style.backgroundColor = slide?.color ?? DEFAULT_COLOR;

            // Title
            let element_title = document.createElement("div");
            element_title.classList.add('cs-legend-item--title');
            element_title.innerHTML = slide.title;
            
            list_item.append(element_value, element_color, element_title);
            list.appendChild(list_item);
        });

        this.selector.appendChild(list);
    };

    /**
     * Create slider(s)
     */
    createSlides = () => {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("height", this.height);
        svg.setAttribute("width", this.width);
        svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);


        this.slides.forEach((slide, index) => {
            // Calculate angle in radians
            let angle = this.calculateAngle(slide.min, slide.max, slide.value);
            this.slides[index].angle = angle;

            // Calculate step percent
            let steps = (slide.max - slide.min) / slide.step; // Number of steps
            this.slides[index].step_angle = CIRCLE_IN_RADIANS / steps; // Angle in radians

            // Arc or circle to show selected range
            let active_range = document.createElementNS("http://www.w3.org/2000/svg", "path");
            active_range.setAttribute("d", this.getArcPath(slide.radius, angle, this.width, this.height));
            active_range.setAttribute("stroke", `${slide.color}aa`); // Add alpha
            active_range.setAttribute("class", "cs-circle");
            active_range.setAttribute("data-index", index);

            // Circle "dot" element to move the slider value
            let dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", (slide.radius * Math.cos(angle)) + (this.width / 2));
            dot.setAttribute("cy", (slide.radius * Math.sin(angle)) + (this.height / 2));
            dot.setAttribute("r", 10);
            dot.setAttribute("class", "cs-dot");
            dot.setAttribute("data-index", index);

            // Background circle
            let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", (this.width / 2));
            circle.setAttribute("cy", (this.height / 2));
            circle.setAttribute("r", slide.radius);
            circle.setAttribute("stroke-dasharray", "8 2");
            circle.setAttribute("class", "cs-circle cs-back");
            
            // Create a group
            let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.dataset.index = index;
            
            // Append group elements
            group.appendChild(circle);
            group.appendChild(active_range);
            group.appendChild(dot);
            
            // Append group
            svg.appendChild(group);
        });
        
        // Create wrapper and add svg
        let svg_wrapper = document.createElement("div");
        svg_wrapper.classList.add("cs-slides")
        svg_wrapper.appendChild(svg);
        
        this.selector.appendChild(svg_wrapper);
        
        // Add start event for each "dot"
        document.querySelectorAll("svg .cs-dot").forEach(item => {
            item.addEventListener("mousedown", this.movingStarted);
            item.addEventListener("touchstart", this.movingStarted);
        });

        // Add mouse and touch event to the window
        window.addEventListener("mousemove", this.movingRange);
        window.addEventListener("touchmove", this.movingRange);
        window.addEventListener("mouseup", this.movingEnded);
        window.addEventListener("touchend", this.movingEnded);
    };
    
    /**
     * Get arc or circle path
     * @param {number} radius Radius
     * @param {number} angle Angle
     * @param {number} width Container width
     * @param {number} height Container height
     * @returns {string} Svg Path
     */
    getArcPath = (radius, angle, width, height) => {
        if (CIRCLE_IN_RADIANS === angle) {
            // Return path for a circle 
            return `M ${(width / 2)} ${(height / 2)}
                m -${radius}, 0
                a ${radius},${radius} 0 1,0 ${radius * 2},0
                a ${radius},${radius} 0 1,0 -${radius *2},0`;
        }

        // Is first or second part of an arc
        let angle_draw = (Math.PI < angle) ? "1" : "0";
        
        // Return path for a arc
        return `M ${(width / 2) + radius} ${height / 2}
                A ${radius} ${radius} 0 ${angle_draw} 1 ${(radius * Math.cos(angle)) + (width / 2)} ${(radius * Math.sin(angle)) + (height / 2)}`;
    };

    /**
     * Format value with currency formatting 
     * @param {number} value Value to be formatted
     * @returns {string} Formatted value
     */
    getFormattedValue = (value) => {
        return new Intl.NumberFormat(NUMBER_FORMAT_LOCALES, NUMBER_FORMAT_OPTIONS).format(value);
    };

    /**
     * Touch or mouse event completed
     */
    movingEnded = () => {
        // Reset variables
        this.is_moving = false;
        this.moving_index = null;
        this.almost_reached_max_value = false;
        this.almost_reached_min_value = false;
    };

    /**
     * Touch or mouse event - moving.
     * 
     * @param {TouchEvent|MouseEvent} event 
     */
    movingRange = (event) => {
        if (true === this.is_moving) {
            // Add 90deg, due to svg rotataion
            let new_angle = (this.calculateNewAngle(event) + (Math.PI / 2));

            if (new_angle > CIRCLE_IN_RADIANS) {
                // new angle is more than 360deg
                new_angle = new_angle % CIRCLE_IN_RADIANS;
            }
           
            if (this.almost_reached_min_value && (new_angle > (Math.PI / 2))) { // 90deg
                if (new_angle > ((Math.PI / 2) * 3)) { // 270deg
                    // User reached the start
                    this.slides[this.moving_index].angle = 0;
                    this.slides[this.moving_index].value = this.slides[this.moving_index].min;
                    new_angle = 0;
                }
            } else if (this.almost_reached_max_value && (new_angle < ((Math.PI / 2) * 3))) { // 270deg
                if (new_angle < (Math.PI / 2)) { // 90deg
                    // User reached the end
                    this.slides[this.moving_index].angle = CIRCLE_IN_RADIANS;
                    this.slides[this.moving_index].value = this.slides[this.moving_index].max;
                    new_angle = CIRCLE_IN_RADIANS;
                }
            } else {
                this.slides[this.moving_index].angle = new_angle;
            }

            // Update dot element
            let element = document.querySelector(`.cs-dot[data-index="${this.moving_index}"]`);
            element.setAttribute("cx", (this.slides[this.moving_index].radius * Math.cos(new_angle)) + (this.width / 2));
            element.setAttribute("cy", (this.slides[this.moving_index].radius * Math.sin(new_angle)) + (this.height / 2));

            // Update path element
            element = document.querySelector(`.cs-circle[data-index="${this.moving_index}"]`);
            element.setAttribute("d", this.getArcPath(this.slides[this.moving_index].radius, new_angle, this.width, this.height));

            this.slides[this.moving_index].value = this.calculateValueFromAngle(new_angle, this.slides[this.moving_index]); 
            // this.updateRecords();
            this.updateBounds();

            document.querySelector(`.cs-legend-item[data-index="${this.moving_index}"] .cs-legend-item--value`).innerHTML = this.getFormattedValue(this.slides[this.moving_index].value);
        }
    };

    /**
     * Touch or mouse event started
     * @param {TouchEvent|MouseEvent} event 
     */
    movingStarted = (event) => {
        this.is_moving = true;
        this.moving_index = event.target.dataset.index;
        this.updateBounds();
    };

    /**
     * Update state if user has almost reached the start or end of the slider.
     * max is reached when angle is more than 315deg
     * min is reached when angle is less than 45deg
     */
    updateBounds = () => {
        this.almost_reached_max_value = this.slides[this.moving_index].angle > (CIRCLE_IN_RADIANS - (Math.PI / 4));
        this.almost_reached_min_value = this.slides[this.moving_index].angle < (Math.PI / 4);
    };

    /**
     * To make a sliders "perfect", radius can't be smaller than 20.
     * Radius between each slider must be at least 20.
     * @returns {boolean} true when all radiuses are ok
     * @throws Exception when radius is too small between the slides
     */
    validateRadius = () => {
        // List of radiuses
        let radiuses = [];

        for (let index in this.slides) {
            // Add all radiuses to the array
            radiuses.push(this.slides[index].radius);
        }

        // Sort radiuses 
        radiuses.sort(function (a, b) {
            return a - b;
        });

        // Check if smallest 
        if (radiuses[0] < 20) {
            // Smallest radius can't be less than 20
            throw "Radius can not be smaller than 20.";
        }

        // Difference between each slide must be at least 20.
        for (let i = 1; i < radiuses.length; i++) {
            if ((radiuses[i] - radiuses[i - 1]) < 20) {
                throw "Radius between the slides is less than 20.";
            }
        }

        return true;
    };

    /**
     * Slides Object should have minimum required data for display
     * @returns {boolean} true when all slides are valid
     * @throws Exception when one slide does not have all required properties
     */
    validateSlides = () => {
        // Check all objects in a list
        for (let index in this.slides) {
            let slide = Object.keys(this.slides[index]);

            if ((false === slide.includes("max")) ||
                (false === slide.includes("min")) ||
                (false === slide.includes("radius")) ||
                (false === slide.includes("step"))) {
                throw "Slide does not have all required properties (max, min, radius, step)<br />" + JSON.stringify(this.slides[index]);
            }
        };

        return true;
    };
};

export default CircleSlider;