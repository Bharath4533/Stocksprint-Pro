import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CandleChart = ({ candles = [], height = 220, isLine = false }) => {
  if (!candles || candles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Loading chart data...</Text>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - 48;
  const padding = { top: 20, bottom: 25, left: 10, right: 10 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  candles.forEach(c => {
    const high = c.high || c.c || 0;
    const low = c.low || c.c || 0;
    if (high > maxPrice) maxPrice = high;
    if (low < minPrice) minPrice = low;
  });

  if (minPrice === maxPrice) {
    minPrice -= 5;
    maxPrice += 5;
  }

  const priceRange = maxPrice - minPrice;
  const getY = price => padding.top + plotHeight - ((price - minPrice) / priceRange) * plotHeight;
  const candleWidth = Math.max(2, Math.min(12, (plotWidth / candles.length) * 0.7));

  // If Line mode
  if (isLine) {
    const points = candles.map((c, i) => {
      const x = padding.left + (i / (candles.length - 1)) * plotWidth;
      const y = getY(c.close || c.c);
      return `${x},${y}`;
    }).join(' ');

    const isGain = (candles[candles.length - 1].close || 0) >= (candles[0].open || candles[0].close || 0);
    const strokeColor = isGain ? Colors.gainGreen : Colors.lossRed;

    return (
      <View style={{ height }}>
        <Svg width={chartWidth} height={height}>
          <Polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            points={points}
          />
        </Svg>
      </View>
    );
  }

  // Candlestick mode
  return (
    <View style={{ height }}>
      <Svg width={chartWidth} height={height}>
        {candles.map((c, i) => {
          const x = padding.left + (i / (candles.length - 1)) * plotWidth;
          const openY = getY(c.open || c.c);
          const closeY = getY(c.close || c.c);
          const highY = getY(c.high || c.c);
          const lowY = getY(c.low || c.c);

          const isUp = (c.close || c.c) >= (c.open || c.c);
          const color = isUp ? Colors.gainGreen : Colors.lossRed;
          const bodyY = Math.min(openY, closeY);
          const bodyHeight = Math.max(2, Math.abs(closeY - openY));

          return (
            <React.Fragment key={i}>
              {/* Wick */}
              <Line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth="1.2"
              />
              {/* Candle Body */}
              <Rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                rx="1"
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
});

export default CandleChart;
