# Stock Price Tracker

A real-time stock price tracking application built with Flask and JavaScript that allows users to monitor multiple stock tickers simultaneously.

## Features

- **Real-time Stock Tracking**: Monitor stock prices with automatic updates
- **Add/Remove Stocks**: Easily manage your watchlist of stocks
- **Persistent Storage**: Your watchlist is saved between sessions
- **User-Friendly Interface**: Clean, responsive design with Bootstrap styling
- **Auto-Complete**: Smart ticker symbol suggestions while typing
- **Real-Time Updates**: Prices update automatically every few seconds

## Technology Stack

- **Backend**:
  - Flask (Python web framework)
  - SQLite3 (Database)
  - yfinance (Yahoo Finance API wrapper)

- **Frontend**:
  - HTML5
  - JavaScript (jQuery)
  - Bootstrap 4
 

## Prerequisites

- Python 3.x
- pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/junouno7/stock-tracker.git
cd stock-tracker
```

2. Install the required Python packages:
```bash
pip install flask yfinance
```

3. Run the application:
```bash
python app.py
```

4. Open your web browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Enter a stock ticker symbol in the input field
2. Click "Add" or press Enter to add the stock to your watchlist
3. The stock price will automatically update every few seconds
4. To remove a stock, click the delete button next to the ticker

## API Endpoints

- `GET /api/stocks` - Get list of tracked stocks
- `POST /api/stocks` - Add a new stock to track
- `DELETE /api/stocks/<ticker>` - Remove a stock from tracking
- `POST /get_stock_data` - Get current price data for a stock
