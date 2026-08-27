// High Performance HTML5 Canvas Stock Chart for NexTrade Pro

class StockCanvasChart {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.candles = [];
    this.chartType = options.chartType || 'candlestick'; // 'candlestick' or 'line'
    this.showVolume = options.showVolume !== false;
    this.showSMA = options.showSMA !== false;
    this.crosshair = null; // { x, y }

    this.setupEvents();
    this.resize();
  }

  setData(candles = []) {
    this.candles = candles;
    this.render();
  }

  setChartType(type) {
    this.chartType = type;
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height || 360;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.crosshair = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.crosshair = null;
      this.render();
    });

    // Touch support for mobile devices
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.crosshair = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
        this.render();
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.crosshair = null;
      this.render();
    });
  }

  render() {
    const { ctx, width, height, candles, chartType } = this;
    if (!ctx || !width || !height) return;

    ctx.clearRect(0, 0, width, height);

    if (!candles || candles.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading candlestick data...', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 65, bottom: 40, left: 15 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = (height - padding.top - padding.bottom) * (this.showVolume ? 0.75 : 1);
    const volumeHeight = this.showVolume ? (height - padding.top - padding.bottom) * 0.20 : 0;
    const volumeTop = padding.top + chartHeight + 10;

    // Find Price and Volume Min/Max
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    }

    const priceBuffer = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice;

    // Coordinate helpers
    const getX = (index) => padding.left + (index * (chartWidth / (candles.length - 1 || 1)));
    const getY = (price) => padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    const getVolY = (vol) => volumeTop + volumeHeight - (vol / (maxVolume || 1)) * volumeHeight;

    const isDark = document.body.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const greenColor = '#00c076';
    const redColor = '#ff3b57';

    // 1. Draw Grid Lines & Price Axis Labels
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const numYGrid = 5;
    for (let i = 0; i <= numYGrid; i++) {
      const price = minPrice + (i / numYGrid) * priceRange;
      const y = getY(price);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText('₹' + price.toFixed(2), width - padding.right + 6, y + 4);
    }

    // 2. Draw Volume Histogram
    if (this.showVolume) {
      const candleWidth = Math.max(1, (chartWidth / candles.length) * 0.7);
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const x = getX(i);
        const y = getVolY(c.volume);
        const isUp = c.close >= c.open;
        ctx.fillStyle = isUp ? 'rgba(0, 192, 118, 0.25)' : 'rgba(255, 59, 87, 0.25)';
        ctx.fillRect(x - candleWidth / 2, y, candleWidth, volumeTop + volumeHeight - y);
      }
    }

    // 3. Draw Price Chart (Candlestick or Line)
    if (chartType === 'candlestick') {
      const candleWidth = Math.max(2, (chartWidth / candles.length) * 0.65);

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const x = getX(i);
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);
        const isUp = c.close >= c.open;
        const color = isUp ? greenColor : redColor;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // Draw Wick
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw Body
        const topY = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(openY - closeY));
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyHeight);
      }
    } else {
      // Line Chart with Gradient Fill
      ctx.beginPath();
      for (let i = 0; i < candles.length; i++) {
        const x = getX(i);
        const y = getY(candles[i].close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = greenColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Area Fill
      const lastX = getX(candles.length - 1);
      ctx.lineTo(lastX, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, 'rgba(0, 192, 118, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 192, 118, 0.00)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 4. SMA 20 Moving Average Overlay
    if (this.showSMA && candles.length > 20) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      for (let i = 19; i < candles.length; i++) {
        let sum = 0;
        for (let j = 0; j < 20; j++) sum += candles[i - j].close;
        const sma = sum / 20;
        const x = getX(i);
        const y = getY(sma);
        if (i === 19) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 5. Crosshair & Tooltip on Hover
    if (this.crosshair) {
      const { x, y } = this.crosshair;
      if (x >= padding.left && x <= width - padding.right && y >= padding.top && y <= height - padding.bottom) {
        // Find nearest candle index
        const index = Math.min(candles.length - 1, Math.max(0, Math.round(((x - padding.left) / chartWidth) * (candles.length - 1))));
        const candle = candles[index];
        const candleX = getX(index);
        const candleY = getY(candle.close);

        // Draw Crosshair Lines
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(candleX, padding.top);
        ctx.lineTo(candleX, height - padding.bottom);
        ctx.moveTo(padding.left, candleY);
        ctx.lineTo(width - padding.right, candleY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Floating Price Tooltip
        const dateStr = new Date(candle.time).toLocaleDateString('en-IN', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const tooltipText = `O: ₹${candle.open}  H: ₹${candle.high}  L: ₹${candle.low}  C: ₹${candle.close}  Vol: ${candle.volume.toLocaleString('en-IN')}`;

        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 1;

        const ttWidth = 340;
        const ttHeight = 26;
        const ttX = Math.min(width - ttWidth - 10, Math.max(10, candleX - ttWidth / 2));
        const ttY = 6;

        ctx.fillRect(ttX, ttY, ttWidth, ttHeight);
        ctx.strokeRect(ttX, ttY, ttWidth, ttHeight);

        ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tooltipText, ttX + ttWidth / 2, ttY + 17);

        // Time axis indicator
        ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
        ctx.fillRect(candleX - 45, height - padding.bottom + 4, 90, 20);
        ctx.fillStyle = textColor;
        ctx.fillText(dateStr, candleX, height - padding.bottom + 18);
      }
    }
  }
}
