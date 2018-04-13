# Index Builder

This is a nice little interactive survey using completely randomized data in which users can:
* create unique usernames
* select factors by giving them a weight, pro/anti direction & supporting reasons
* lock-in selections in order to see what kind of index your combination of factors have built
* compare performance of your index against some default indexes as well as other users
* an admin user can:
** view interesting breakdowns of all factor selections made by users as well as make these breakdowns available for users to see
** archive off user selections for further future analysis and to reset the app for another round of users

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.
Once you've checked out this project you must make sure you have the following installed:

Include instructions on setting up virtualenv

To get up and running perform the following:
pip install -r requirements.txt

In order to install scipy I had to run the following:
sudo apt-get install gfortran libopenblas-dev liblapack-dev python-dev
pip install scipy==0.15.1
easy_install numpy==1.9.2
easy_install pandas==0.16.2

You'll need node, npm & yarn installed
yarn install
npm run build

### Prerequisites

* pip
* easy_install
* virtualenv
* node
* npm
* yarn

### Installing


Setting up your virtual environment

```
1) mkdir -p ~/pyenvs
2) virtualenv ~/pyenvs/index_builder
3) source ~/pyenvs/index_build/bin/activate
4) pip install -r requirements.txt
5) sudo apt-get install gfortran libopenblas-dev liblapack-dev python-dev (assuming you're running linux)
6) pip install scipy==0.15.1
7) easy_install numpy==1.9.2
8) easy_install pandas==0.16.2
```

Building the javascript

```
1) yarn install
2) npm run build
```

Running the Flask back-end

```
python index_builder/server.py --HOST 0.0.0.0 --PORT 8080 --AUTH true
```

Running the Flask back-end with gunicorn

```
gunicorn server:app --config gunicorn_config.py --bind 0.0.0.0:8080 -w 8 -t 120 --limit-request-line 8190 --log-file=- --access-logfile ~/stdout --error-logfile ~/stderr  --log-level=info
```

Building the javascript files in "watch" mode (this is good for development so it will hot swap changes)

```
npm run watch
```

## Running the tests

Python tests

```
python setup.py test
```

All JS tests

```
npm run test
```

Specific JS tests

```
TEST=static/__tests__/factor_viewer/*-test.jsx npm run test-file
```

JS coverage report

```
npm run test-with-coverage
```

JS Duplication report

```
npm run report-duplicate-code
```

JS formatting

```
npm run format
```

JS linting

```
npm run lint -s
```


## Deployment

You can run this application on a larger scale using gunicorn
```
export AUTH=true (if you want authentication turned on)
gunicorn server:app --config gunicorn_config.py --bind 0.0.0.0:8080 -w 8 -t 120 --limit-request-line 8190 --log-file=- --access-logfile ~/stdout --error-logfile ~/stderr  --log-level=info

```

TBA: notes on docker deployment

## Built With

* [Flask](http://flask.pocoo.org/) - The back-end web framework used
* [jinja](http://jinja.pocoo.org/) - Core HTML templating
* [yarn](https://yarnpkg.com/en/) - JS Dependency Management
* [Webpack](https://webpack.js.org/) - JS Bundler
* [React](https://reactjs.org/) - Core JS library our components are built on

## Authors

* **Andrew Schonfeld** - *Initial work* - [plutoplate](https://github.com/aschonfeld/plutoplate)

See also the list of [contributors](https://github.com/aschonfeld/index_builder/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [Wilfred Hughes](https://github.com/Wilfred) was truly an inspiration and a driving force behind many of the solutions to initial infrastructure headaches
