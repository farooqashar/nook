## Nooks Watch Party Project

In this takehome project, we want to understand your:
- ability to build something non-trivial from scratch
- comfort picking up unfamiliar technologies
- architectural decisions, abstractions, and rigor

We want to respect your time, so please try not to spend more than 5 hours on this. We know that this is a challenging task & you are under time pressure and will keep that in mind when evaluating your solution.

### Instructions

To run the app simply "npm i" and then "npm start"

### Problem
Your task is to build a collaborative “Watch Party” app that lets a distributed group of users watch youtube videos together. The frontend should be written in Typescript (we have a skeleton for you set up) and the backend should be written in Node.JS. The app should support two main pages:

- `/create` **Create a new session**
    - by giving it a name and a youtube video link. After creating a session `ABC`, you should be automatically redirected to the page `/watch` page for that session
- `/watch/:sessionId` **Join an existing session**
    
    *⚠️ The player must be **synced for all users at all times** no matter when they join the party*
    
    - **Playing/pausing/seek** the video. When someone plays/pauses the video or jumps to a certain time in the video, this should update for everyone in the session
    - **Late to the party**... Everything should stay synced if a user joins the session late (e.g. if the video was already playing, the new user should see it playing at the correct time)
        
### Assumptions

- This app obviously **doesn’t need to be production-ready**, but you should at least be aware of any issues you may encounter in more real-world scenarios.
- We gave you all of the frontend UX you’ll need in the [starter repo](https://github.com/NooksApp/nooks-fullstack-takehome), including skeleton pages for the `create` and `watch` routes, so you can focus on implementing the core backend functionality & frontend video playing logic for the app.
- You should probably use **websockets** to keep state synchronized between multiple users.

You will need to embed a Youtube video directly in the website. In our skeleton code we use [react-player](https://www.npmjs.com/package/react-player), but feel free to use another library or use the [Youtube IFrame API](https://developers.google.com/youtube/iframe_api_reference) directly.

In order to sync the video, you’ll need to know when any user plays, pauses, or seeks in their own player and transmit that information to everyone else. In order to get play, pause, and seek events you can use:
1. [YouTube iFrame API - Events](https://developers.google.com/youtube/iframe_api_reference#Events)
2. Build your own custom controls for play, pause & seek. If you choose  this option, make sure the controls UX works very similarly to youtube’s standard controls (e.g. play/pause button and a slider for seek)

### Required Functionality

- [x] **Creating a session**. Any user should be able to create a session to watch a given Youtube video.
- [x] **Joining a session**. Any user should be able to join a session created by another user using the shareable session link.
- [x] **Playing/pausing** the video. When a participant pauses the video, it should pause for everyone. When a participant plays the video, it should start playing for everyone.
- [x] **“Seek”**. When someone jumps to a certain time in the video it should jump to that time for everyone.
- [x] **Late to the party**... Everything should stay synced even if a user joins the watch party late (e.g. the video is already playing)
- [x] **Player controls.** All the player controls (e.g. play, pause, and seek) should be intuitive and behave as expected. For play, pause & seek operations you can use the built-in YouTube controls or disable the YouTube controls and build your own UI (including a slider for the seek operation)

🚨 **Please fill out the rubric in the README with the functionality you were able to complete**


### Architecture Questions

After building the watch party app, we would like you to answer the following questions about design decisions and tradeoffs you made while building it. Please fill them out in the README along with your submission.

1. **How did you approach the problem? What did you choose to learn or work on first? Did any unexpected difficulties come up - if so, how did you resolve them?**

I first chose to work on the functionality of how to connect a sessionId to a given URL and play the right video file for a given session since I first noticed the hard-coded youtube url first. After that, I decided to work on creating a session and realized that the key thing was to associate a mapping of sessionID to various data attributes, such as progress of a video and the youtube url, etc., thus this needed to be communicated in real-time to all the users of a given session. I then decided to first learn how to make sockets work and found out that socket.io and its client version were the standard and thus decided to setup a basic node.js server that only sent out events when user connected and eventually send over the youtube link to the backend to be updated in a mapping. It has been a while since I worked on real-time application that required websockets, such as chat apps, so I then watched a tutorial on how sockets work. I had difficulty in sending the events from the backend to the frontend and spent a lot of time debugging until I realized that I never sent the events to a particular session. I resolved this issue by always noticing where the events/data were being sent to and keeping in mind of the larger mapping data type I had developed. After that, I worked on pause/play and eventually ran into issues with ReactPlayer since I couldn't find out how to play the video at a current time and some documentation were heavily outdated, thus I debugged and eventually figured out a function to seek the time.

2. **How did you implement seeking to different times in the video? Are there any other approaches you considered and what are the tradeoffs between them?**

I originally considered using a url approach as a youtube video allows us to pass in the time to start the video at by adding "?t=sometime", but I realized that the major con here was that there was a lot of refreshing going on as the youtube url itself kept changing fast in case the user seeked too fast. In addition, managing where the urls are and its content got too large of a problem to try to break down into smaller steps accurately. Another approach I considered was to simply keep as up to date object as possible in the mapping in the backend between a session and its various attributes. In this case, the major win was that the information was as accurate as it can be. I decided to implement this data structure. For the implementation of a seek detection, I decided to not build something on top of the existing ReactPlayer as some research indicated that other tools were far more low level than they needed to be. I decided to implement seek detection by noticing that a seek is basically when there is a substantial movement in the current time of the video as the user switches to another spot likely not too close to the current time. I thus saw if the difference between the current video time and the previous video time was above a threshold, then it was a seek. I tried a threshold of 5 first, but it turned out that people can seek a little bit ahead, thus had to reduce the threshold to 2 second difference. With this frontend detection of a seek, I emitted a socket event that trigged the backend to emit an event that said to all users of a given session to sync time based on the latest progress of the video.
   

3. **How do new users know what time to join the watch party? Are there any other approaches you considered and what were the tradeoffs between them?**

New users know what time to join the watch party because when a new user joins, there is a socket event emitted from the frontend letting the backend server know that a new user has joined this particular session. With this knowledge, the backend checks the mapping of a given session and its associated value of progress on the current state of the video along with the youtube url. It then emits a socket event to pass the latest progress of the video/session to the new user that joined. I considered a url approach to letting the late user figure out the latest progress of the video by simplifying modifying the url, but this had a con of too many refresh/not a pleasant user experience of watching a video since the url kept changing with small time changes, leading to bad quality. 

4. **How do you guarantee that the time that a new user joins is accurate (i.e perfectly in sync with the other users in the session) and are there any edge cases where it isn’t? Think about cases that might occur with real production traffic.**

The way to ensure accuracy is to keep the backend mapping of a session to the current, real-time progress of the video as up to date as possible. This means that the frontend during any progress whatsoever emits an event to let the backend know what the global, real-time progress of the video/session is. This is the most natural way since if we do not know what the current progress of the session is, then there is no way to know what time the video should be at when a new user joins. There is an edge case where this updating is either not happening frequently enough. With real production traffic, it doesn't seem plausible to keep emitting events with a really short interval for the tradeoff of optimization. Ideally, we would want to keep actual, real-time progress in the backend(or a database in production). However, the con is that there will be too many writes in this case that will ultimately have a higher latency with many users trying to access the resource, thus there would have to be rate limiting and resource management needed in a production-like environment. There is also an assumption in this system that the phrase "when the user joins" when the user gets to the watch page before they even click the "Watch session" as that appears to be a workout for Youtube autoplay issue. In reality, there is another layer or obstacle for the user when they already have a presumptive shareable link that was given to them by someone with a sessionID. An edge case here is that a user is on the link, but doesn't actually click watch session for a while. The tradeoff here is that we would have to do more event emitting and listening to get even more real-time data from the backend instead of getting some data right when the user is on the link that they were given. With too much data accessing from backend, the site would get slow, especially with real production traffic.

5. **Are there any other situations - i.e race conditions, edge cases - where one user can be out of sync with another? (Out of sync meaning that user A has the video playing or paused at some time, while user B has the video playing or paused at some other time.)**

Yes, one situation is two users at the same exact time click to pause a video or play a video. The server would need to decide what would happen as typically, both user's information could be processed sequentially and someone could be slighly delayed. If one user's action causes the video to end, but the other user's video does not end and there isn't real-time communication, then there could be major app problems. There are also concurrency issues to be dealt with that can affect real-time communication. Think of ACID transactions failing in a database. Another set of situations arises due to network and connection issues. If there is high latency and network load, some information may be not updated as quickly in the backend and all of the socket.io events might be slightly delayed, thus there could be a temporry out of sync behavior when the backend mapping isn't updated accurately or the frontend is not able to get the latest progress as quickly for instance for several users. There are also variations in the device/hardware capabilities of each user, thus a slower computer or a computer that cannot handle as many CPU computations may have trouble being in full sync with other users. Think of any bad Zoom or Youtube video where the computer does not respond for instance.

6. **How would you productionize this application to a scale where it needs to be used reliably with 1M+ DAUs and 10k people connected to a single session? Think infrastructure changes, code changes & UX changes.**

From the perspective of infrastructure changes, there needs to be many changes in terms of scaling up the backend. This includes utilizing a distributed architecture with multiple microservices that can handle an operation dealing with creating, reading, updating, and deleting. There can also be load balancers to ensure that the application's performance and optimization is not adversely harmed. There can also be the addition of a scalable database in order to make data persistent and realiably accessed without causing too much performance harm. Tools like Docker, Kubernetes, and MongoDB(faster read/write operations can be benefical when trying to work with real-time data on intervals as compared to mysql databases) can help productionize this application. In terms of code changes, there needs to be a caching system implemented to save performance in case not much is happening in a session, like an extended break or if the user has left the session on for a long time. Think of screen savers and autolocks as examples of why this is needed. There can also be more asynchronous methods to get other data/metadata that may be needed for a full production application. There can also be work done to more intuitively identify users and sessions as compared to with long IDs. This leads into UX changes where a better login based system of users and sessions can provide a better experience when trying to create easy to remember sessions and sharing links. In addtion, adding more notifications and views about how many people are in a session, who these people, and the status of the session can make the user more knowledgeable about what's going on in the current session. Eventually, sharing sensitive links can invite more encryption of links and security procedures in addition to error handling of what youtube links are wrong or formatted incorrectly. 


🚨 **Please fill out this section in the README with answers to these questions, or send the answers in your email instead.**

### Help & Clarifications

If you want something about the problem statement clarified at any point while you’re working on this, feel free to **email me** at nikhil@nooks.in or even **text me** at 408-464-2288. I will reply as soon as humanly possible and do my best to unblock you.

Feel free to use any resource on the Internet to help you tackle this challenge better: guides, technical documentation, sample projects on Github — anything is fair game! We want to see how you can build things in a real working environment where no information is off limits.

### Submission

When you’ve finished, please send back your results to me via email as a **zip file**. Make sure to include any instructions about how to run the app in the README.md. 

I will take a look and schedule a time to talk about your solution!

