# Circular slider 

## How to use
```js
let slider = new CircleSlider({
    selector: "#slider", // Element selector
    slides: [
        {
            color: "#ff0000", // Color
            min: 0, // Minimum value
            max: 500, // Maxium value
            step: 100, // One step
            title: "Title", // Slide title
            value: 0, // Current value
            radius: 50, // Slider radius
        },
    ],
});
```