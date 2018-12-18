The Following package contains the frontend for the invision goat-3d-product configurator.
As well as a small API to upload images and
 supply webcrawler routes for opengraph(facebook, e.g.) and  twitter cards.
  

Follow the installation instructions below if you want to install this software package.  
   
# Installation   

Notes:
* Depending on the settings in the file "server/config.js" a upload folder will be generated for you that stores the GIF images whenever a user shares his content.
ans in apache
    * For the file upload to work the server might have to be set to a higher file size limit. 
    * e.g. nginx ````client_max_body_size 20M;````   
      
* Twitter sharing requires the service to run transparently under port 80, otherwise the twitter crawler will trow a HTTPConnectionTimeout and the cards wont't be rendered as they should.
    * one way to achieve this is to use vhosts / proxy_pass settings in nginx or similar means
    

## Dependencies
* git
* npm
* apt-get

  
 
## Step 1
* on the server, navigate to your desired installation directory. Default for the project is:

````
cd /usr/share/nginx/html/goat-dev 
````


## Step 2
* you now have different options to start the application
### Option 1 (testing) 
* following commands will start server including (use your github login credentials when asked)
````
rm gun-customizer -r &&
git clone https://github.com/SymboInteractive/gun-customizer.git --branch develop --single-branch &&
cd gun-customizer &&
npm install &&
npm run-script build &&
cd server &&
npm install &&
npm run-script start
````

### Option 2 (testing)

* this will start the pure file server without the gif upload and node server
````
rm gun-customizer -r &&
git clone https://github.com/SymboInteractive/gun-customizer.git --branch develop --single-branch &&
cd gun-customizer &&
npm install &&
npm run-script build &&
cd dist/gun-customizer &&
http-server -p 8081
````

### Option 3 (production)

* make sure pm2 is installed or use:
````
npm install pm2 -g 
````

* install the application similar to option 1 or 2 
````
rm gun-customizer -r &&
git clone https://github.com/SymboInteractive/gun-customizer.git --branch develop --single-branch &&
cd gun-customizer &&
npm install &&
npm run-script build &&
cd server &&
npm install

````

* run the application as a service first time starting pm2    
````
# pm2 start server.js
pm2 start server.config.js --env production
pm2 startup
````    
* restarting pm2 after new release e. g. 

````
pm2 restart server.config.js --env production
# save potential changes 
pm2 save

````

   
# testing
* localtunnel can be used to test features like facebook/twitter sharing
````
npm install -g localtunnel
````
* lt -p \<port> --subdomain \<subdomain>
````
lt -p 3000 --subdomain mighty-starfish-59
````
* kill server
````   
    # use kill3000 command to stop process whenever necessary 
   alias kill3000="fuser -k -n tcp 3000"
````




#"Backlog"
## potential improvements
* migrate log to
    * https://github.com/SymboInteractive/gun-customizer/issues                 

* twitter response
    * show user on preview so if user has multiple accounts he is not irritated
    * twitter invalidate token    

* facebook 
    * invision3d.org is deemed bad on fb
        * Ok, talked with my friend at FB, apparently they have updated they algorithms and blocked lots of weapon related content today. One thing we can do is to remove all text with the word”GUN” in it, to avoid been blocked. Let’s try that when you have time, and see if that works. Thanks
    * test via tunnel until facebook scraper finds what it needs...
        * https://developers.facebook.com/tools/debug/og/object/
    * use clients facebook api key
* preview should use transformation node for orientation offset and scaling of mesh
       
                    
## TODO 


* stream upload for browsers that support it
    * https://github.com/fbsamples/Canvas-Streaming-Example
    * https://github.com/google/WebFundamentals/blob/master/src/content/en/updates/2016/10/capture-stream.md
    * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
    * https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

* how to handle if content was deleted on the server
    * currently page links to files anyway       
* delete file if user aborts sharing
 
* update tests and documentation    
    
## done
