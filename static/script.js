var tickers = [];
var lastPrices = {};
var glocounter = 15;
var timerInterval;
var alertedTickers = {};

function loadTickers() {
    $.ajax({
        url: '/api/stocks',
        type: 'GET',
        success: function(data) {
            tickers = data;
            tickers.forEach(function(ticker) {
                addTickerToGrid(ticker);
            });
            if (tickers.length > 0) {
                updatePrices();
                startUpdateCycle();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading tickers:', error);
            alert('Failed to load tickers. Please try again later.');
        }
    });
}

function startUpdateCycle() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    counter = glocounter;
    updatePrices();
    timerInterval = setInterval(function () {
        counter--;
        $('#counter').text(counter + ' ');
        if (counter <= 0) {
            updatePrices();
            counter = glocounter;
        }
    }, 1000);
}

$(document).ready(function () {
    loadTickers();

    $('#add-ticker-form').submit(function (e) {
        e.preventDefault();
        var newTicker = $('#new-ticker').val().toUpperCase();
        if (!tickers.includes(newTicker)) {
            $.ajax({
                url: '/api/stocks',
                type: 'POST',
                data: JSON.stringify({'ticker': newTicker}),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: function(response) {
                    tickers.push(newTicker);
                    addTickerToGrid(newTicker);
                    updatePrices();

                    if (!timerInterval) {
                        counter = glocounter;
                        startUpdateCycle();
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error adding ticker:', error);
                }
            });
        }
        $('#new-ticker').val('');
        hideSuggestions();
    });

    function hideSuggestions() {
        $('#autocomplete-suggestions').hide();
    }

    $(document).on('click', '.remove-btn', function(e) {
        e.stopPropagation();
        const tickerToRemove = $(this).data('ticker');
        
        $.ajax({
            url: `/api/stocks/${tickerToRemove}`,
            type: 'DELETE',
            success: function(response) {
                tickers = tickers.filter(t => t !== tickerToRemove);
                $(`#${tickerToRemove}`).remove();

                if (tickers.length === 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    $('#counter').text('');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error removing ticker:', error);
            }
        });
    });

    $('#new-ticker').on('input', function () {
        var query = $(this).val().toUpperCase();
        showSuggestions(query);
    });

    $('#autocomplete-suggestions').on('click', '.suggestion-item', function () {
        var selectedTicker = $(this).text();
        $('#new-ticker').val(selectedTicker);
        hideSuggestions();
    });

    function showSuggestions(query) {
        $('#autocomplete-suggestions').empty();
        if (query.length > 0) {
            var filteredTickers = Alltickers.filter(function (ticker) {
                return ticker.toLowerCase().includes(query.toLowerCase());
            });

            filteredTickers.forEach(function (ticker) {
                $('#autocomplete-suggestions').append('<div class="suggestion-item">' + ticker + '</div>');
            });

            if (filteredTickers.length > 0) {
                $('#autocomplete-suggestions').show();
            } else {
                $('#autocomplete-suggestions').hide();
            }
        } else {
            $('#autocomplete-suggestions').hide();
        }
    }
});

function addTickerToGrid(ticker) {
    const stockBox = `
        <div id="${ticker}" class="stock-box">
            <h2>${ticker}</h2>
            <p id="${ticker}-price"></p>
            <p id="${ticker}-pct"></p>
            <button class="remove-btn" data-ticker="${ticker}">Remove</button>
        </div>`;
    $('#tickers-grid').append(stockBox);

    $(`#${ticker}`).on('click', function(e) {
        if (!$(e.target).hasClass('remove-btn')) {
            showChart(ticker);
        }
    });
}

function showChart(ticker) {
    window.open(`https://finance.yahoo.com/quote/${ticker}/chart?p=${ticker}`, '_blank');
}

function handleStockError(ticker) {
    if (!alertedTickers[ticker]) {
        alert(`Invalid ticker symbol: ${ticker}`);
        alertedTickers[ticker] = true;
        
        $.ajax({
            url: `/api/stocks/${ticker}`,
            type: 'DELETE',
            success: function(response) {
                tickers = tickers.filter(t => t !== ticker);
                $(`#${ticker}`).remove();
                
                if (tickers.length === 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    counter = glocounter;
                    $('#counter').text('');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error removing invalid ticker:', error);
            }
        });
    }
}

function updatePrices() {
    tickers.forEach(function (ticker) {
        $.ajax({
            url: '/get_stock_data',
            type: 'POST',
            data: JSON.stringify({'ticker': ticker}),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function(data) {
                var changePercent = ((data.currentPrice - data.openPrice) / data.openPrice) * 100;
                var colorClass;
                if (changePercent <= -2) {
                    colorClass = 'dark-red';
                }
                else if (changePercent < 0) {
                    colorClass = 'red';
                }
                else if (Math.abs(changePercent) < 0.01) {
                    colorClass = 'gray';
                }
                else if (changePercent <= 2) {
                    colorClass = 'green';
                }
                else {
                    colorClass = 'dark-green';
                }

                $(`#${ticker}-price`).text(`$${data.currentPrice.toFixed(2)}`);
                $(`#${ticker}-pct`).text(`Last 24HR: ${changePercent.toFixed(2)}%`);
                $(`#${ticker}-price`).removeClass('dark-red red gray green dark-green').addClass(colorClass);
                $(`#${ticker}-pct`).removeClass('dark-red red gray green dark-green').addClass(colorClass);
                
                var flashClass;
                if (lastPrices[ticker] > data.currentPrice) {
                    flashClass = 'red-flash';
                }
                else if (lastPrices[ticker] < data.currentPrice) {
                    flashClass = 'green-flash';
                }
                else {
                    flashClass = 'gray-flash';
                }
                lastPrices[ticker] = data.currentPrice;

                $(`#${ticker}`).addClass(flashClass);
                setTimeout(function(){
                    $(`#${ticker}`).removeClass(flashClass);
                }, 2200);
            },
            error: function(xhr, status, error) {
                handleStockError(ticker);
            }
        });
    });
}

var Allthetickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B', 'UNH', 'V',
    'JNJ', 'WMT', 'PG', 'MA', 'HD', 'DIS', 'PYPL', 'VZ', 'CSCO', 'ADBE',
    'NFLX', 'INTC', 'XOM', 'KO', 'PFE', 'MRK', 'BA', 'ABT', 'NKE', 'T',
    'PEP', 'MCD', 'CVX', 'IBM', 'CAT', 'AMGN', 'RTX', 'GS', 'C', 'MDT',
    'BABA', 'TSM', 'WFC', 'GE', 'AXP', 'INTU', 'AMT', 'CVS', 'MS', 'SPGI',
    'MMM', 'DELL', 'ISRG', 'LMT', 'GS', 'UNP', 'DUK', 'TMO', 'LUV', 'CL',
    'ADP', 'SQ', 'PFE', 'KO', 'GM', 'STZ', 'NOW', 'LOW', 'F', 'REGN',
    'WBA', 'ZTS', 'CHTR', 'MO', 'EOG', 'NSC', 'MCO', 'EQIX', 'CME', 'SNAP',
    'HUM', 'PLD', 'BLK', 'NSC', 'SBUX', 'SHW', 'TGT', 'CVS', 'CCL', 'RTX',
    'DHR', 'MSCI', 'CB', 'SYK', 'XOM', 'CSX', 'KMB', 'VLO', 'FIS', 'HCA',
    'AXP', 'RMD', 'TFC', 'CLX', 'OXY', 'BMY', 'FISV', 'VLO', 'ECL', 'SPGI',
    'AMZN', 'GS', 'EXC', 'CHTR', 'AON', 'SYY', 'MU', 'PRU', 'PPG', 'LMT',
    'MPC', 'BKR', 'BNS', 'AIG', 'SNAP', 'SQ', 'TGT', 'TMO', 'AMT', 'MS',
    'BIDU', 'BBY', 'MELI', 'NKE', 'AMGN', 'AAPL', 'MSFT', 'GOOGL', 'AMZN',
    'TSLA', 'NVDA', 'META', 'BRK-B', 'UNH', 'V', 'JNJ', 'WMT', 'PG', 'MA',
    'HD', 'DIS', 'PYPL', 'VZ', 'CSCO', 'ADBE', 'NFLX', 'INTC', 'XOM', 'KO',
    'PFE', 'MRK', 'BA', 'ABT', 'NKE', 'T', 'PEP', 'MCD', 'CVX', 'IBM', 'CAT',
    'AMGN', 'RTX', 'GS', 'C', 'MDT', 'BABA', 'TSM', 'WFC', 'GE', 'AXP', 'INTU',
    'AMT', 'CVS', 'MS', 'SPGI', 'MMM', 'DELL', 'ISRG', 'LMT', 'GS', 'UNP',
    'DUK', 'TMO', 'LUV', 'CL', 'ADP', 'SQ', 'PFE', 'KO', 'GM', 'STZ', 'NOW',
    'LOW', 'F', 'REGN', 'WBA', 'ZTS', 'CHTR', 'MO', 'EOG', 'NSC', 'MCO', 'EQIX',
    'CME', 'SNAP', 'HUM', 'PLD', 'BLK', 'NSC', 'SBUX', 'SHW', 'TGT', 'CVS',
    'CCL', 'RTX', 'DHR', 'MSCI', 'CB', 'SYK', 'XOM', 'CSX', 'KMB', 'VLO',
    'FIS', 'HCA', 'AXP', 'RMD', 'TFC', 'CLX', 'OXY', 'BMY', 'FISV', 'VLO',
    'ECL', 'SPGI', 'AMZN', 'GS', 'EXC', 'CHTR', 'AON', 'SYY', 'MU', 'PRU',
    'PPG', 'LMT', 'MPC', 'BKR', 'BNS', 'AIG', 'SNAP', 'SQ', 'TGT', 'TMO',
    'AMT', 'MS', 'BIDU', 'BBY', 'MELI', 'NKE',
    'BTC-USD', 'ETH-USD', 'XRP-USD', 'USDT-USD', 'BNB-USD', 'SOL-USD', 'DOGE-USD', 'DOT-USD', 'LTC-USD', 'ADA-USD',
    'USDC-USD', 'MATIC-USD', 'BUSD-USD', 'SHIB-USD', 'AVAX-USD', 'TRX-USD', 'FTM-USD', 'NEAR-USD', 'ALGO-USD', 'ATOM-USD',
    'CRO-USD', 'XLM-USD', 'VET-USD', 'FTT-USD', 'HNT-USD', 'DASH-USD', 'MKR-USD', 'EGLD-USD', 'AAVE-USD', 'KSM-USD',
    'RUNE-USD', 'SAND-USD', 'ENJ-USD', 'GRT-USD', 'ZRX-USD', 'LRC-USD', 'KAVA-USD', 'CELO-USD', 'HBAR-USD', 'ICP-USD',
    'FLOW-USD', 'LEND-USD', 'STMX-USD', 'MITH-USD', 'STPT-USD', 'TWT-USD', 'BAND-USD', 'REN-USD', 'STPT-USD', 'MITH-USD',
    'TWT-USD', 'BAND-USD', 'REN-USD', 'STMX-USD', 'LEND-USD', 'FLOW-USD', 'ICP-USD', 'HBAR-USD', 'CELO-USD', 'KAVA-USD',
    'LRC-USD', 'ZRX-USD', 'GRT-USD', 'ENJ-USD', 'SAND-USD', 'RUNE-USD', 'KSM-USD', 'AAVE-USD', 'EGLD-USD', 'MKR-USD',
    'DASH-USD', 'HNT-USD', 'FTT-USD', 'VET-USD', 'XLM-USD', 'CRO-USD', 'ATOM-USD', 'ALGO-USD', 'NEAR-USD', 'FTM-USD',
    'TRX-USD', 'AVAX-USD', 'SHIB-USD', 'BUSD-USD', 'MATIC-USD', 'USDC-USD', 'ADA-USD', 'LTC-USD', 'DOT-USD', 'DOGE-USD',
    'SOL-USD', 'BNB-USD', 'USDT-USD', 'XRP-USD', 'ETH-USD', 'BTC-USD'
];

var Alltickers = [...new Set(Allthetickers)];
