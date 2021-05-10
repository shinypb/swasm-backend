# SWASM

## Terminology
A **job** is a combination of some WASM code and a **payload** for it to operate on. These pairings are defined in `.jobdef` files.

Jobs are executed by the **runner** in your web browser.

## Getting started
1. `npm install`
2. `npm start`
3. `open http://localhost:8000/#24`

Assuming everything is working, you should see this in your console:
```[SCHEDULER] Worker completed successfully: Hello, world!```

## What just happened?

0. The runner connected to the backend and requested the code and payload for the job with id `24` (which was specified in the URL)
1. The runner instantiated a new WebAssembly instance, copied the payload into its memory, and ran its `main` function
2. The job took its payload (which was the string `world`), inserted it into the string `"Hello, " + payload + "!"`, and passed the result back to the runner
3. The runner stopped the job

## Tweaking the payload

0. Open up `public/jobs/hello-world.txt`
1. Replace the word "world" with your name and save the file
2. Enqueue a job with your new payload: run `bin/swasm-create public/jobs/hello-world.jobdef`

Your terminal should have a line along these lines:
```If you want to run this specific job: http://localhost:8000/#25```

Open that URL up and you should see your customized greeting.


## Tweaking the code

0. Open up `public/jobs/hello-world.ts`
1. Change the word "Hello" to "Ahoy" and save the file

Repeat the steps from above to enqueue a job with your new code.

## Debugging
It's a pain to have to enqueue a new job every time you want to run your code, so there's also a debug mode.

Open up [localhost:8000/debug.html#hello-world](http://localhost:8000/debug.html#hello-world) to run the hello-world in debug mode. This runs the code directly from the local server (specifically the file `public/jobs/hello-world.wasm`), and runs it against a pre-defined payload.

You can find the pre-defined debug payloads inside of `client/js/debug.js`.