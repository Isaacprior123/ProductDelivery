module.exports = {
    aliases: ['linkaccount'],
    async run(client, message, args, sendError, getUserInfo) {
        const Discord = require("discord.js");
        const axios = require("axios");

		//Ensure data
		await client.guildSettings.ensure(message.guild.id, {
			prefix: client.config.defaultPrefix
		})
	  
		//Prefix fetching code
		let prefix = await client.guildSettings.get(`${message.guild.id}.prefix`)

        if(!args[0]){
			const failureembed = new Discord.MessageEmbed()
			.setColor('RED')
			.setTitle(`Link Account`)
			.setDescription(`You need to provide a Roblox account name.\n\n**Example**: \`${prefix}link accountname\``)
			return message.channel.send(failureembed)
		}

		const embed1 = new Discord.MessageEmbed()
		.setColor('YELLOW')
		.setTitle(`Link Account`)
		.setDescription('⌛ Contacting Roblox')
		let verifymsg = await message.channel.send(embed1)

		//Look up the user based on the provided username
        try {
            let checkusername = await axios({
                method: 'POST',
                url: `https://users.roblox.com/v1/usernames/users`,
                data: {
                    "usernames": [
                        args[0]
                    ],
                    "excludeBannedUsers": true
                },
            })

            if(checkusername.data.data[0]){
                //Check if user is already linked
                const alreadyverified = new Discord.MessageEmbed()
                .setColor('RED')
                .setTitle('Already Linked')
                .setDescription(`**${args[0]}** has already been verified under a different Discord account.\nPlease try to link another Roblox account.`)
                let existingUserInfo = await getUserInfo(`${checkusername.data.data[0].id}`)
                if(existingUserInfo.verified) return verifymsg.edit(alreadyverified)

                //Lookup Roblox user information
                try {
                    let response = await axios({
                        method: 'GET',
                        url: `https://users.roblox.com/v1/users/${checkusername.data.data[0].id}`,
                    })

                    //Create emoji string out of discord id
                    let encodingarray = ["✈️", "😄", "🐷", "🐶", "🍎", "😎",  "🤯", "😂", "🏝️", "😮"]
					let splitid = message.member.id.split('')
					let encodedid = []
					for (i in splitid){
						encodedid.push(encodingarray[splitid[i]])
					}
					let verificationcode = encodedid.join(' ') || 'Verification Code: ' + endodedid.join(' ')

					if(response.data.description.split('\n').includes(verificationcode)){
                        //Save to database
                        await client.robloxLink.set(message.author.id, {
                            "robloxID": `${response.data.id}`,
                            "robloxUsername": response.data.name
                        })

                        //Send success message
						const successembed = new Discord.MessageEmbed()
						.setColor('GREEN')
						.setTitle(`Link Account`)
						.setDescription(`Your account has been linked.\nLinked Account: [**${response.data.name}**](https://www.roblox.com/users/${response.data.id}/profile)\nYou can now remove the verification text from your profile.`)
						.setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${response.data.id}&width=420&height=420&format=png`)
						verifymsg.edit(successembed)
					}else{
						const failureembed = new Discord.MessageEmbed()
						.setColor('RED')
						.setTitle(`Link Account`)
						.setDescription(`Please set your roblox about page to the following text.\nAfter you do this, run this command again.\n\`${verificationcode}\``)
						.setImage('https://i.imgur.com/gBjhWkk.png')
						verifymsg.edit(failureembed)
						return message.channel.send(`**Verification Code:** ${verificationcode}`)
					}
                } catch (error) {
                    const failureembed = new Discord.MessageEmbed()
					.setColor('RED')
					.setTitle(`Link Account`)
					.setDescription(`There was an error contacting Roblox. Please try again later. \nIf this error persists, contact an admin.`)
					return verifymsg.edit(failureembed)
                }
			}else{
				const failureembed = new Discord.MessageEmbed()
				.setColor('RED')
				.setTitle(`Link Account`)
				.setDescription('The provided username is invalid. Please make sure you spelt it correctly.')
				return verifymsg.edit(failureembed)
			}
        } catch (error) {
            console.log(error)
            const failureembed = new Discord.MessageEmbed()
			.setColor('RED')
			.setTitle(`Link Account`)
			.setDescription(`There was an error contacting Roblox or a general error. Please try again later. \nIf this error persists, contact an admin.`)
			return verifymsg.edit(failureembed)
        }
    }
};