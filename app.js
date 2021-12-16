import CircleSlider from "./Slider.js";

const chart_data = [];

document.getElementById("demo").addEventListener("click", (event) => {
    chart_data.push({
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        min: 0,
        max: 4,
        step: 1,
        title: (Math.random() + 1).toString(36).substring(2),
        value: 0,
        radius: (30 * chart_data.length) + 20
    });
    chart_data.push({
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        min: 0,
        max: 100,
        step: 10,
        title: (Math.random() + 1).toString(36).substring(2),
        value: 0,
        radius: (30 * chart_data.length) + 20
    });
    chart_data.push({
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        min: 0,
        max: 500,
        step: 100,
        title: (Math.random() + 1).toString(36).substring(2),
        value: 0,
        radius: (30 * chart_data.length) + 20
    });
    chart_data.push({
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        min: 0,
        max: 50000,
        step: 10,
        title: (Math.random() + 1).toString(36).substring(2),
        value: 4000,
        radius: (30 * chart_data.length) + 20
    });
    chart_data.push({
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        min: 50,
        max: 100,
        step: 10,
        title: (Math.random() + 1).toString(36).substring(2),
        value: 70,
        radius: (30 * chart_data.length) + 20
    });
    chart_data.push({
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        min: 2,
        max: 4,
        step: 1,
        title: (Math.random() + 1).toString(36).substring(2),
        value: 3,
        radius: (30 * chart_data.length) + 20
    });

    let slider = new CircleSlider({
        selector: "#slider",
        slides: chart_data,
    });

    document.getElementById("demo").remove();
});