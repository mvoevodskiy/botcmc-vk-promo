const CronJob = require('cron').CronJob;

class BotCMSVKPromo {

    init (target) {
        return next => () => {
            // console.log('BOTCMS VK PROMO. INIT');
            this.params = target.mwParams['botcms-vk-promo'];
            this.askFriendsSent = [];
            let congrats = new CronJob(
                this.params.birthday.start,
                () => {
                    console.log('CRON JOB STARTED');
                    this._congratulationBirthday(this, target);
                },
                () => {},
                false,
                'Atlantic/Reykjavik'
            );
            congrats.start();
            setTimeout(this._welcomeFriends, 2000, this, target);
            return next();
        }
    }

    initDB (target) {
        return next => () => {
            // console.log(this.params);
            // console.log('BOTCMS VK PROMO. DB INIT');
            // target.dbParams.entities.push(process.cwd() + '/node_modules/botcms-users/lib/entity/*.js');
            const result = next();

            this.DB = target.DB;
            // console.log('BOTCMS VK PROMO. DB INIT END');
            return result;
        }
    }

    failDB (target) {
        return next => error => {
            console.error('BOTCMS VK PROMO. DB FAIL. FATAL');
            console.error(error);
            process.exit(-1);
        }
    }

    // handleUpdate (target) {
    //     return next => async ctx => {
    //
    //         new Promise(async resolve => {
    //             console.log('BOTCMS USER. HADNLE UPDATE. BEGIN');
    //             let userRepository = target.DB.getRepository('User');
    //             let localUser;
    //             let requestUserId = ctx.Message.sender.id === target.SELF_SEND ? 0 : ctx.Message.sender.id;
    //             if (requestUserId === 0) {
    //                 let selfUserInfo = await ctx.Bridge.fetchUserInfo();
    //                 requestUserId = selfUserInfo.id;
    //             }
    //             console.log('BOTCMS USER. HADNLE UPDATE. REQUEST USER ID: ', requestUserId);
    //             localUser = await userRepository.findOne({
    //                 user_id: requestUserId,
    //                 driver: ctx.Bridge.driverName,
    //             });
    //             console.log('BOTCMS USER. HADNLE UPDATE. LOCAL USER ', localUser);
    //             if (target.T.empty(localUser)) {
    //                 let userInfo = await ctx.Bridge.fetchUserInfo(requestUserId);
    //                 console.log(userInfo);
    //                 localUser = new User;
    //                 localUser.user_id = userInfo.id;
    //                 localUser.username = userInfo.username;
    //                 localUser.full_name = userInfo.full_name;
    //                 localUser.first_name = userInfo.first_name;
    //                 localUser.last_name = userInfo.last_name;
    //                 localUser.type = userInfo.type;
    //                 localUser.bridge = ctx.Bridge.name;
    //                 localUser.driver = ctx.Bridge.driverName;
    //                 localUser.createdon = Date.now() / 1000 | 0;
    //                 userRepository.save(localUser);
    //             }
    //         });
    //         return next(ctx);
    //     }
    // }

    async _welcomeFriends (t, target) {
        setTimeout(async() => {
            let bridge = target.bridges[t.params.bridge];
            let askFriends = await bridge.Transport.api.friends.getRequests({
                need_viewed: 0
            });
            // console.log('WELCOME FRIENDS. REQUESTS: ', askFriends);
            if (!target.T.empty(askFriends.count)) {
                for (let friendId of askFriends.items) {
                    if (t.askFriendsSent.indexOf(friendId) === -1) {
                        t.askFriendsSent.push(friendId);
                        let parcel = new target.classes.Parcel;
                        parcel.message = t.params.ask_friend.message;
                        parcel.peerId = friendId;
                        bridge.send(parcel);
                    }
                }
            }
            t._welcomeFriends(t, target);
        }, target.T.random(1, t.params.ask_friend.delay) * 1000, t, target);
    }

    async _congratulationBirthday (t, target) {
        let date = new Date();
        let bridge = target.bridges[t.params.bridge];
        let todayFriends = await bridge.Transport.api.users.search({
            from_list: 'friends',
            birth_day: date.getDate(),
            birth_month: date.getMonth() + 1,
        });
        console.log(todayFriends);
        if (!target.T.empty(todayFriends.count)) {
            t._congratulationBirthdaySend(t, target, bridge, todayFriends.items);
        }
    }

    async _congratulationBirthdaySend (t, target, bridge, friends) {
        setTimeout(() => {
            if (!target.T.empty(friends)) {
                let friend = friends.shift();
                let parcel = new target.classes.Parcel;
                parcel.message = t.params.birthday.message;
                parcel.peerId = friend.id;
                bridge.send(parcel);
                console.log('SENT. PARCEL:', parcel);
                t._congratulationBirthdaySend(t, target, bridge, friends);
            }
        }, target.T.random(1, t.params.birthday.delay) * 1000, t, target, bridge, friends);
    }
}

module.exports = BotCMSVKPromo;