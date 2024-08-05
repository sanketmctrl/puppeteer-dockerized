After installing all the dependencies

### Build the docker image

docker build -t website-screenshot .

### Run the docker image

docker run -p 3000:3000 --name p-dockerized website-screenshot

### Test if puppeteer is working as expected

http://localhost:3000/screenshot?url=https://google.com

### Test if lighthouse analysis is working as expected

http://localhost:3000/analyze?url=https://google.com