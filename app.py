import yfinance as yf
from flask import request, render_template, jsonify, Flask
import sqlite3
from datetime import datetime

app = Flask(__name__, template_folder='templates')

# Database initialization
def init_db():
    conn = sqlite3.connect('stocks.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_stocks
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         ticker TEXT NOT NULL,
         added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
with app.app_context():
    init_db()

def get_db():
    conn = sqlite3.connect('stocks.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT ticker FROM user_stocks')
    stocks = [row['ticker'] for row in c.fetchall()]
    conn.close()
    return jsonify(stocks)

@app.route('/api/stocks', methods=['POST'])
def add_stock():
    ticker = request.get_json()['ticker']
    conn = get_db()
    c = conn.cursor()
    
    # Check if stock already exists
    c.execute('SELECT ticker FROM user_stocks WHERE ticker = ?', (ticker,))
    if c.fetchone() is None:
        c.execute('INSERT INTO user_stocks (ticker) VALUES (?)', (ticker,))
        conn.commit()
        conn.close()
        return jsonify({'message': f'Added {ticker}'}), 201
    
    conn.close()
    return jsonify({'message': f'{ticker} already exists'}), 409

@app.route('/api/stocks/<ticker>', methods=['DELETE'])
def remove_stock(ticker):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM user_stocks WHERE ticker = ?', (ticker,))
    conn.commit()
    conn.close()
    return jsonify({'message': f'Removed {ticker}'}), 200

@app.route('/get_stock_data', methods=['POST'])
def get_stock_data():
    ticker = request.get_json()['ticker']
    data = yf.Ticker(ticker).history(period='1d')
    if data.empty:
        return jsonify({'error': f'Invalid ticker symbol: {ticker}'}), 400
    return jsonify({'currentPrice': data.iloc[-1].Close,
                   'openPrice': data.iloc[-1].Open})

if __name__ == '__main__':
    app.run(debug=True)