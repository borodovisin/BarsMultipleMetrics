import echarts from 'echarts';
import { 
    getFont,
    getXAxisData,
    getSeries,
    SIFormat,
    getMetricTooltip,
    setTextAndRotationLabel,
    groupAccessorName,
    metricAccesorName,
 } from './utils';

import './index.css';

/**
 * Global controller object is described on Zoomdata knowledge base
 * @see https://www.zoomdata.com/developers/docs/custom-chart-api/controller/
 */

/* global controller */

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/creating-chart-container/
 */
const chartContainer = document.createElement('div');
chartContainer.classList.add('chart-container');
controller.element.appendChild(chartContainer);

// Dynamic splitNumber to avoid overlap in YAxis
echarts.registerProcessor(ecModel => {
    ecModel.findComponents({ mainType: 'yAxis' }).map(component => {
        const defaultSplitNumber = 5;
        const calculatedRatio = Math.floor(component.axis.grid.getRect().height / (defaultSplitNumber * component.getTextRect('0').height));
        const ratio = calculatedRatio > defaultSplitNumber ? defaultSplitNumber : calculatedRatio;
        
        if (ratio < 1) component.option.axisLabel.show = false;
        else {
            component.option.splitNumber = ratio;
            component.option.axisLabel.show = true;
        }
    });
});

// Modify dynamically the rotation and text labels
echarts.registerPostUpdate((ecModel, api) => {
    const zr = api.getZr();
    // Get all component from ZRender
    zr.storage.updateDisplayList();

    zr.storage.getDisplayList().map(display => {
        if (display.type === 'rect') {
            const { height, width } = ecModel.getComponent('series').getTextRect(_.get(display, 'style.text'));
            setTextAndRotationLabel(display, height, width);
        }
    });
});

const bar = echarts.init(chartContainer);

const option = {
    grid: {
        left: 40,
        top: 30,
        right: 35,
        bottom: 30,
    },
    xAxis: {
        type: 'category',
        axisLabel: getFont(),
    },
    yAxis: {
        axisLabel: {
            ...getFont(),
            formatter: value => SIFormat(value, 2),
        }
    },
    series: [],
}

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/updating-queries-axis-labels/
 */
controller.createAxisLabel({
    picks: groupAccessorName,
    orientation: 'horizontal',
    position: 'bottom',
    popoverTitle: 'Group'
});

controller.createAxisLabel({
    picks: metricAccesorName,
    orientation: 'vertical',
    position: 'left',
});

/**
 * @see http://www.zoomdata.com/developers/docs/custom-chart-api/receiving-chart-data/
 */
controller.update = data => {
    option.xAxis.data = getXAxisData(data);
    option.series = getSeries(data);
    bar.setOption(option, { notMerge: true })
};

controller.resize = () => bar.resize();

// Tooltip
bar.on('mousemove', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            content: () => {
                return getMetricTooltip(params);
            }
        });
    }
});

bar.on('mouseout', params => {
    controller.tooltip.hide();
});

// Menu bar
bar.on('click', params => {
    if (_.has(params, 'data.datum') && _.isObject(params.data.datum)) {
        controller.tooltip.hide();
        controller.menu.show({
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            data: () => params.data.datum,
        });
    }
});
