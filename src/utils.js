import echarts from 'echarts';
import visualization from '../visualization.json';

export const groupAccessorName = visualization.variables[0].name;
export const metricAccesorName = visualization.variables[1].name;

const groupAccesor = controller.dataAccessors[groupAccessorName];
const metricAccesor = controller.dataAccessors[metricAccesorName];

const getTableRow = (label, value, color='') => `<div class="zd_tooltip_info_table_row"><div class="zd_tooltip_info_table_row_label">${label}</div><div class="zd_tooltip_info_table_row_value">${color} ${value}</div></div>`;

const getLuminosity = color => {
    const rgb = echarts.color.parse(color);
    const luminosity = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return luminosity >= 165 ? '#000' : '#FFF';
};

/**
 * Return a function to take the first animator value, get the _tracks key, on _tracks get width if exists,
 * after that get the last with track and after that get the value.
 * This value represent the end value of width when animation is finished.
 */
const getFinalWidth = _.flow(_.first, _.partialRight(_.get, '_tracks'), 
                             _.partialRight(_.get, 'width'), _.last, 
                             _.partialRight(_.get, 'value'));

/**
 * Format number to k, M, G (thousand, Million)
 * @param {Number} number 
 * @param {Number} digits 
 */
export const SIFormat = (number, digits=0) => {
    const codeTable = ['p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T'];
    const [exponentialNumber, exponential] = number.toExponential(digits).split('e');
    const index = Math.floor(_.parseInt(exponential) / 3);
    return exponentialNumber * Math.pow(10, _.parseInt(exponential) - index * 3) + codeTable[index + 4];
};

export const getFont = () => ({
    fontFamily: 'Source Pro, source-sans-pro, Helvetica, Arial, sans-serif',
    fontSize: '14',
});

export const getXAxisData = data => data.map(datum => _.first(datum.group));

export const getSeries = data => metricAccesor._accessors.map(accesor => {
    const name = accesor.getLabel();
    const color = controller.getColorAccessor().color({ label: name });
    const serie = { 
        type: 'bar', 
        name,
        label: {
            "show": true,
            position: 'insideBottom',
            formatter: '{a}',
            rotate: 90,
            verticalAlign: 'center',
            align: 'left',
            color: getLuminosity(color),
            textBorderWidth: 2,
            textBorderColor: color,
        },
        itemStyle: {
            color,
        },
        emphasis: {
            label: {
                show: false,
            }
        }, 
    };
    serie.data = data.map(datum => ({ value: accesor.raw(datum), datum }));
    return serie;
});

export const getMetricTooltip = params => {
    if (_.get(params, 'color') && _.get(params, 'data.datum') && _.get(params, 'value')) {
        const color = `<div class="color_icon active" style="background-color: ${params.color};"></div>`;
        const groupByLabel = groupAccesor.getLabel();
        const metricValue = metricAccesor.format(params.value, params.seriesIndex);
        return `<div class="zd_tooltip_info_group customized"><div class="zd_tooltip_info_table"><div class="zd_tooltip_info_table_row">${getTableRow(groupByLabel, params.name)}</div>${getTableRow(params.seriesName, metricValue, color)}</div></div>`;
    }
    return '';
};

/**
 * Logic for hide the text when is out of bar sizes and rotate the text to vertical and horizontal position
 * @param {object} display Rectangle object that represent a bar in the char
 * @param {number} textHeight 
 * @param {number} textWidth 
 */
export const setTextAndRotationLabel = (display, textHeight, textWidth) => {
    const labelExtraWidth = (2 * (_.get(display, 'style.textDistance') || 0)) + (_.get(display, 'style.textPadding') || 0);
    const finalWidth = getFinalWidth(display.animators) || display.shape.width;

    if (textHeight > finalWidth) {
        display.setStyle({ text: '' });
    } else if (finalWidth > (textWidth + labelExtraWidth)) {
        display.setStyle({ 
            textRotation: (0 * Math.PI / 180), 
            textAlign: 'center', 
            textDistance: 2 * display.style.textDistance, 
        });
    } 
};
