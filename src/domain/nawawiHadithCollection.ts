export type HadithLibraryContentKind = 'text' | 'arabic';

export interface HadithLibraryContentBlock {
  readonly kind: HadithLibraryContentKind;
  readonly text: string;
}

export interface NawawiHadithEntry {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly blocks: readonly HadithLibraryContentBlock[];
}

export const NAWAWI_COLLECTION_ID = 'nawawi-forty';
export const NAWAWI_COLLECTION_TITLE = 'The Forty Nawawi Hadiths';
export const NAWAWI_COLLECTION_AUTHOR = 'Imam al-Nawawi';
export const NAWAWI_COLLECTION_AUTHOR_ALIASES = Object.freeze([
  'Imam Al Nawawi',
  'Imam Nawawi',
  'al-Nawawi',
  'Nawawi',
] as const);

// Faithful text transcription from the user-provided “The Forty Nawawi Hadiths” document.
// The supplied document contains 42 numbered hadith entries; all 42 are preserved here.
export const nawawiHadithEntries = Object.freeze([
  {
    id: 'nawawi-01',
    number: 1,
    title: 'The First Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Amir-il-Mu’minin (the leader of the Believers) Abu Hafs ^Umar bin al-Khattab, may Allah accept his deeds, who said: I heard the Messenger of Allah, sallallahu ^alayhi wa sallam, say:',
      },
      {
        kind: 'text',
        text: '<<The religious matters are valid only with proper intentions; and one acquires that which he intended. The one whose Immigration was for the sake of Allah and His Messenger, then his Immigration is accepted. And the one whose Immigration was for a worldly gain or for marrying a woman, then his Immigration is for the purpose he intended and is not accepted.>>',
      },
      {
        kind: 'text',
        text: 'Narrated by the two Imams of the Scholars of Hadith, Abu ^Abdillah Muhammad bin Isma^il bin Ibrahim bin al-Mughirah bin Bardizbah al-Bukhari, and Abu al-Husayn Muslim bin al-Hajjaj bin Muslim al-Qushayri an-Naysaburi in their two books of As–Sahih which are the most Sahih books that have been compiled.',
      },
    ],
  },
  {
    id: 'nawawi-02',
    number: 2,
    title: 'The Second Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'Also from the route of ^Umar who said: While we were sitting one day with the Messenger of Allah, sallallahu ^alayhi wa sallam, a man appeared in our session with very white clothes and very black hair. He did not have any signs of travelling on him, and no one of us knew him.',
      },
      {
        kind: 'text',
        text: 'He sat down before the Prophet, sallallahu ^alayhi wa sallam, and placed his knees against the Prophet’s and placed his palms on his thighs. He said: O Muhammad inform me about Islam. The Messenger of Allah, sallallahu ^alayhi wa sallam said:',
      },
      {
        kind: 'text',
        text: '<<Islam is to testify that no one is God except Allah and that Muhammad is the Messenger of Allah , to perform the prayers, to pay Zakat, to fast Ramadan and to perform Pilgrimage if able.>>',
      },
      {
        kind: 'text',
        text: 'He said: you are truthful. We were surprised at the fact that he asked him and corroborated his truthfulness! He said: Inform me about the Belief. The Prophet said:',
      },
      {
        kind: 'text',
        text: '<<To believe in Allah, His Angels, His Books, His Messengers, The Day of Judgment, and Destiny—what is good and what is evil.>> He said: You are truthful. He said: Inform me about Ihsan (proficiency of worship). The Prophet said:',
      },
      {
        kind: 'text',
        text: '<<To worship Allah as if you see Him and if you do not, then know that He Sees you.>>',
      },
      {
        kind: 'text',
        text: 'He said: Inform me about the time of occurrence of the Day of Judgment. The Prophet said: <<The one whom you asked does not know any more about it than the one asking.>> He said: Inform me about its signs. The Prophet said:',
      },
      {
        kind: 'text',
        text: '<<To witness the slave woman give birth to her female owner, and the barefoot, unclothed, impoverished shepherds build high rise buildings.>> Then the man left. I stayed for a lengthy period of time then the Prophet said:',
      },
      {
        kind: 'text',
        text: '<<O ^Umar do you know the one who was asking?>> I said Allah and His Messenger know best. The Prophet said:',
      },
      {
        kind: 'text',
        text: '<<He was Jibril; he came to teach you the matters of your Religion.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-03',
    number: 3,
    title: 'The Third Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu ^Abdir-Rahman bin ^Umar bin Al-Khattab may Allah accept both of their deeds, who said: I heard the Messenger of Allah, sallallahu ^alayhi wa sallam say: Islam is based on five matters: Testifying no one is God except Allah and that Muhammad is the Messenger of Allah, performing the prayers, paying Zakat, offering Pilgrimage to the glorified house and fasting Ramadan. Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-04',
    number: 4,
    title: 'The Fourth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu ^Abdir-Rahman ^Abdillah bin Mas^ud, may Allah accept his deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, told us and he is the Truthful One and the one to whom the truth is told:',
      },
      {
        kind: 'text',
        text: '<<The appearance of the one of you would be completed in ones mother’s womb for forty days as a Nutfah (joined fertilized sperm.) Then for a similar duration would be as an ^Alaqah (bloody clot.) Then for a similar duration would be as a Mudghah (a piece of flesh.) Then the Angel would be sent to blow the soul into it, and would be ordered to write down four matters: ones sustenance, death time, deeds, and whether one would die a blasphemer or a believer. I swear by Allah, the One whom no one is God but Him, the one of you would perform the deeds that appear to be the deeds of the People of Paradise until a cubit separates one from entering it, then what is written in the Guarded Tablet happens and one would do the deeds of the People of Hellfire, and would enter it. And one of you would perform the deeds of the People of Hellfire until a cubit separates one from entering it, then what is written in the Guarded Tablet happens and one would do the deeds of the People of Paradise, and would enter it. Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-05',
    number: 5,
    title: 'The Fifth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the rout of Umm al-Mu’minin Umm ^Abdillah ^A‘ishah, may Allah accept her deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<Whoever innovates in our Religion a matter that does not conform to it, then it is rejected.>> Narrated by al-Bukhari and Muslim. In another narration for Muslim the Prophet said:',
      },
      {
        kind: 'text',
        text: '<<Whoever does a doing that does not conform to our Religion then it is rejected.>>',
      },
    ],
  },
  {
    id: 'nawawi-06',
    number: 6,
    title: 'The Sixth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu ^Abdillah an-Nu^man bin Bashir, may Allah accept both of their deeds, who said: I heard the Messenger of Allah, sallallahu ^alayhi wa sallam, say:',
      },
      {
        kind: 'text',
        text: '<<The lawful matters are clearly stated and the forbidden matters are clearly stated. And in between them there are matters that many people do not know the judgment of. Hence, the one who avoids falling into questionable matters would protect his religiosity and integrity. The one who falls into the questionable matters will fall into the unlawful, just like the shepherd grazing his flock around a fenced property and who very likely will crossover into it. Indeed, every king has his own protected property and indeed, the boundaries that Allah ordered not to be violated are the forbidden matters. Indeed, there is a bloody small part in the body when it is sound, the entire body will be sound, and if it is spoiled, the entire body will be spoiled. Indeed, it is the heart.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-07',
    number: 7,
    title: 'The Seventh Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Ruqayyah Tamim bin Aws ad-Dari, may Allah accept his deeds, that the Prophet, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<Religiosity is the Nasihah (loyalty and/or support and/or advice).>> We said: offered to whom? He said:',
      },
      {
        kind: 'text',
        text: '<<To Allah, His Book, His Messenger, the leaders of the Muslims and the laypeople among them.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-08',
    number: 8,
    title: 'The Eighth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Ibn ^Umar, may Allah accept both of their deeds, that the Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<I was ordered to fight the people until they say ‘No one is God except Allah and that Muhammad is the Messenger of Allah ‘, and perform the prayers, and pay Zakat. If they do that then they have preserved their blood and money, except if deemed due by the rules of Islam. Allah will judge them for what is other than that.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-09',
    number: 9,
    title: 'The Ninth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah ^Abdir-Rahman bin Sakhr, may Allah accept his deeds, who said: I have heard the Messenger of Allah, sallallahu ^alayhi wa sallam, say:',
      },
      {
        kind: 'text',
        text: '<<What I forbid you from doing, do not do it, and what I order you with, do as much as you can from it. What lead the Nations before you to destruction is their excessive, out of place, questions to their Prophets and the lack of diligence in following their orders.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-10',
    number: 10,
    title: 'The Tenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, who said, The Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<Allah is Attributed with genuine Attributes and only accepts what is lawful. Allah has ordered the believers with what He ordered the Messengers; so Allah said:',
      },
      {
        kind: 'arabic',
        text: 'يَا أَيُّهَا الرُّسُلُ كُلُوا مِنَ الطَّيِّبَاتِ وَاعْمَلُوا صَالِحًا',
      },
      {
        kind: 'text',
        text: '(It means: [O Messengers, eat what is lawful and do the good deeds.]) And Allah said:',
      },
      {
        kind: 'arabic',
        text: 'يَا أَيُّهَا الَّذِينَ آمَنُواْ كُلُواْ مِن طَيِّبَاتِ مَا رَزَقْنَاكُمْ',
      },
      {
        kind: 'text',
        text: '(It means: [O believers eat from the lawful sustenance that We provided for you.])',
      },
      {
        kind: 'text',
        text: 'Then the Prophet mentioned the man who travels extensively to perform obedience, and who is dusty with untidy hair, putting his hands up to the sky making supplication and saying, ‘O Lord, O Lord’, while his food is unlawful, his drink is unlawful, his clothing is unlawful and was nourished unlawfully. How could such a person’s supplication be answered?>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-11',
    number: 11,
    title: 'The Eleventh Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Muhammad al-Hasan bin ^Aliyy bin Abi Talib, the Beloved One and grandson of the Prophet, sallallahu ^alayhi wa sallam from his daughter, who said: I have memorized from the Messenger of Allah, sallallahu ^alayhi wa sallam,',
      },
      {
        kind: 'text',
        text: '<<Do not do the matter (whether lawful or ligitimate) in which you have doubt about its judgment, and resort to doing the matter that you do not have doubt about its judgment.>> Narrated by at-Tirmidhiyy and an-Nasa‘iyy, at-Tirmidhiyy said this Hadith is hasan and sahih.',
      },
    ],
  },
  {
    id: 'nawawi-12',
    number: 12,
    title: 'The Twelfth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, who said: the Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<A way for the person to excel in Islam is not to interfere in the matters which do not concern one.>> This is a hasan Hadith, narrated by at-Tirmidhiyy and others with the same terminology.',
      },
    ],
  },
  {
    id: 'nawawi-13',
    number: 13,
    title: 'The Thirteenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hamzah Anas bin Malik, may Allah accept his deeds, the servant of the Messenger of Allah, sallallahu ^alayhi wa sallam, from the Prophet, sallallahu ^alayhi wa sallam, who said:',
      },
      {
        kind: 'text',
        text: '<< The one of you shall not be a complete believer until he loves for his fellow brother that which he loves for himself.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-14',
    number: 14,
    title: 'The Fourteenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Ibn Mas^ud, may Allah accept his deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<The blood of a Muslim person who testifies no one is God except Allah and that I am the Messenger of Allah, is lawfully taken in only one of three instances: the adulterer/adulteress who had been in a valid marriage, death penalty for one for killing another, and leaving the jama^ah by leaving Islam.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-15',
    number: 15,
    title: 'The Fifteenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, from the Messenger of Allah, sallallahu ^alayhi wa sallam, who said:',
      },
      {
        kind: 'text',
        text: '<<The one who believes in Allah and the Day of Judgment let him utter good things or else be silent. The one who believes in Allah and the Day of Judgment let him be generous to ones neighbor. The one who believes in Allah and the Day of Judgment let him be generous to ones guest.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-16',
    number: 16,
    title: 'The Sixteenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, that a man told the Prophet, sallallahu ^alayhi wa sallam, ‘Advise me’. He said:',
      },
      {
        kind: 'text',
        text: '<<Do not be angry>>, he repeatedly said: <<Do not be angry.>> Narrated by al-Bukhari.',
      },
    ],
  },
  {
    id: 'nawawi-17',
    number: 17,
    title: 'The Seventeenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Ya^la Shaddad bin Aws, may Allah accept his deeds, from the Messenger of Allah, sallallahu ^alayhi wa sallam, that he said:',
      },
      {
        kind: 'text',
        text: '<<Allah ordered that proficiency be applied to everything. So if you kill, then kill properly and if you slaughter, slaughter properly. Let one sharpen one’s blade to make it easier for the animal to be slaughtered.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-18',
    number: 18,
    title: 'The Eighteenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Dharr Jundub bin Junadah and Abu ^Abdir-Rahman Mu^adh bin Jabal, may Allah accept both of their deeds, from the Messenger of Allah, sallallahu ^alayhi wa sallam, who said:',
      },
      {
        kind: 'text',
        text: '<<Be pious wherever you are. Make the good deed follow the bad, because it will erase it, and deal with the people with good manners.>> Narrated by at-Tirmidhiyy and he said this Hadith is hasan, and in some copies hasan sahih.',
      },
    ],
  },
  {
    id: 'nawawi-19',
    number: 19,
    title: 'The Nineteenth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abul-^Abbas ^Abdillah bin ^Abbas, may Allah accept both of their deeds, who said: One day I was behind the Prophet, sallallahu ^alayhi wa sallam. He said:',
      },
      {
        kind: 'text',
        text: '<<O Boy, I will teach you certain matters. Be keen to apply the orders of Allah, and then Allah will protect you. If you obey the orders of Allah, then Allah will help you. If you want to ask someone, it is better to ask Allah. If you seek help, then seek the help of Allah. Do know that if the entire nation agreed to benefit you in something, they would only benefit you in something that Allah decreed and had it written for you. And if they agreed to harm you in something, they would only harm you in something that Allah decreed and had it written for you. This decree is already established, for the writing pens have been lifted and the journals have dried out.>> Narrated by at-Tirmidhiyy and he said this Hadith is hasan sahih.',
      },
      {
        kind: 'text',
        text: 'In the narration of other than at-Tirmidhiyy: <<Obey the orders of Allah and you will encounter the support of Allah. Be cognizant of applying the orders of Allah and Allah will help you in your times of difficulty. Do know that what was meant to pass you by was not meant to afflict you, and what has afflicted you was not meant to pass you by. Do know that triumph is associated with patience, and relief is associated with distress and along with hardships come facilities.>>',
      },
    ],
  },
  {
    id: 'nawawi-20',
    number: 20,
    title: 'The Twentieth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Mas^ud ^Uqbah bin ^Amr Al-Ansariyy Al-Badriyy, may Allah accept his deeds, who said: the Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<Among the statements which the people still use and originally they were said by the Prophets a long time before me: If what you intend to do does not constitute a reason to be shy from Allah and the people, then do whatever you want, or else do not do it.>> Narrated by al-Bukhari.',
      },
      {
        kind: 'text',
        text: 'The meaning could also be: <<If you are not shy from Allah to commit sins, then do whatever you want and face the consequences.>>',
      },
    ],
  },
  {
    id: 'nawawi-21',
    number: 21,
    title: 'The Twenty First Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu ^Amr and it was said Abu ^Amrah Sufian bin ^Abdillah ath-Thaqafi, may Allah accept his deeds, who said: I said: O Messenger of Allah, tell me a concise and enriching statement about Islam that would guide me and I would not have to inquire about it from any one else besides you. He said:',
      },
      {
        kind: 'text',
        text: '<< Say I believe in Allah and adhere to the doings of the upright ones.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-22',
    number: 22,
    title: 'The Twenty Second Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of ^Abdillah Jabir bin ^Abdillah al-Ansari, may Allah accept both of their deeds, who said that a man asked the Messenger of Allah, sallallahu ^alayhi wa sallam, who said: Should you observe that I pray the five prayers that are written on one, and I fast Ramadan, and deem the lawful as lawful and do it and the unlawful as unlawful and avoid it, and I do not add anything to that, would I enter Paradise? He said: <<Yes.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-23',
    number: 23,
    title: 'The Twenty Third Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Malik al-Harith bin ^Asim al-Ash^ariyy, may Allah accept his deeds who said: the Messenger of Allah, sallallahu ^alayhi wa sallam, said: <<Ablution has half the reward of ‘Iman (belief and/or prayer), saying al-hamdulillah (praising Allah) fills the Balance with reward, the reward of saying subhanallah and al-hamdulillah (praising Allah and clearing Him from non befitting attributes) fills what is between the heavens and earth , prayers prevent from sinning and guide to correctness, charity stands as a proof of belief for the donor, patience provides enlightenment along the correct path, the Qur’an either substantiates your good doings or substantiates your bad doings. Each person endeavors and either attempts to be obedient to Allah and save himself from torture, or attempts to follow the devil and ones desires and deserves the torture>>. Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-24',
    number: 24,
    title: 'The Twenty Fourth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Dharr al-Ghifariyy, may Allah accept his deeds, from the Prophet, sallallahu ^alayhi wa sallam, who narrated from Allah, the Exalted, that He said:',
      },
      {
        kind: 'text',
        text: '[O My slaves, I am clear of being Attributed with injustice and I have decreed the prohibition of injustice amongst you, so do not do injustice to one another. O My slaves, all of you will be misguided except the one whom I guide, so seek My guidance and I will guide you. O My slaves, all of you will be hungry except the one whom I feed, so seek My sustenance and I will sustain you. O My slaves, all of you will be naked except the one whom I clothe, so seek Me to clothe you and I will. O My slaves, you err at night and during the day and I forgive all sins, so seek My forgiveness and I will forgive you. O My slaves, you shall not attain to be harmful to Me and harm Me and you shall not attain to be beneficial to Me and benefit Me. O My slaves, had the first till the last among you, humans and jinn, been as pious as the one most pious among you, that would not have added to my Dominion anything. O My slaves, had the first till the last among you, humans and jinn, been as wicked as the one most wicked among you, that would not have decreased anything of My Dominion. O My slaves, had the first till the last among you, humans and jinn, stood on a single piece of land and asked Me, and I had answered each one his need , that would not have decreased what I have, except if the needle immersed in the ocean would decrease any of it. O My slaves, it is your deeds that I keep for you and then I judge you for them. The one who encounters goodness let him be thankful to Allah and the one who encounters other than that let him only blame himself]. Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-25',
    number: 25,
    title: 'The Twenty Fifth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Dharr, may Allah accept his deeds, who said that some people among the Companions of the Prophet, sallallahu ^alayhi wa sallam, asked the Prophet, sallallahu ^alayhi wa sallam: O Messenger of Allah the wealthy people have engulfed the rewards, they pray as we do, fast as we do and spend their excess money in charity. He said:',
      },
      {
        kind: 'text',
        text: '<< Is it not the case that Allah has provided you that which you can spend in charity? There is a charity in every Subhanallah one says, and every Allah Akbar one says, and every al-Hamdulillah one says, and every la ilaha illallah one says, and every lawful matter one orders, and every unlawful matter one prohibits, and every sexual intercourse with ones lawful woman.>>',
      },
      {
        kind: 'text',
        text: 'They said: O Messenger of Allah, would one be rewardable for having sexual intercourse with ones lawful woman? He said:',
      },
      {
        kind: 'text',
        text: '<<Do you not observe that if one had sexual intercourse with an unlawful woman one would be sinful, likewise if one would have sexual intercourse with one’s lawful woman one would be rewardable.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-26',
    number: 26,
    title: 'The Twenty Sixth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<The one among the people should, every day the sun rises, do a good deed with every joint in ones body. To justly reconcile a dispute among two people entails a reward, assisting the man with his riding animal, loading his luggage on it or helping him mount it, entails a reward, every step one takes to go and pray entails a reward, removing the harmful matters from the streets entails a reward.>> Narrated by al-Bukhari and Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-27',
    number: 27,
    title: 'The Twenty Seventh Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of an-Nawwas bin Sam^an, may Allah accept his deeds, who said that the Prophet, sallallahu ^alayhi wa sallam, said: << Good manners are the foundation for philanthropy, and the sinful matter is the matter which wavers inside of you and hate that it would be exposed to the people.>> Narrated by Muslim.',
      },
      {
        kind: 'text',
        text: 'From the route of Wabisah bin Ma^bad, may Allah accept his deeds, who said: I went to the Messenger of Allah, sallallahu ^alayhi wa sallam, and he said:',
      },
      {
        kind: 'text',
        text: '<<Have you come to inquire about philanthropy?>> I said: Yes. He said: << Look inside your heart for a valid sign. Philanthropy is the set of matters ones soul and heart feel comfortable with. Sinning is what burdens oneself and wavers in the chest, even if people attempt to justify for you and give you an edict about it.>>',
      },
      {
        kind: 'text',
        text: 'This Hadith is hasan and is narrated in the Musnads of Imams Ahmad bin Hanbal and ad-Darimiyy with a hasan chain of narration.',
      },
    ],
  },
  {
    id: 'nawawi-28',
    number: 28,
    title: 'The Twenty Eighth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Najih al-^Irbad bin Sariyah, may Allah accept his deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, preached us a far-reaching preach that alerted the hearts and made our eyes shed tears. We said: O Messenger of Allah, as if this is a farewell preach, so advise us. He said:',
      },
      {
        kind: 'text',
        text: '<< I advise you to be pious to Allah. Listen to the rules and obey the rules even if a Habashiyy (Abyssinian) slave was to rule over you. The one among you who shall live long enough shall witness many differences, so adhere to my creed and the creed of the rightly guided Caliphs after me and cling to it with your canine teeth. Be ware of Innovations, because most Innovations belong to misguidance.>>',
      },
      {
        kind: 'text',
        text: 'Narrated by Abu Dawud and at-Tirmidhiyy and he said the Hadith is hasan sahih.',
      },
    ],
  },
  {
    id: 'nawawi-29',
    number: 29,
    title: 'The Twenty-ninth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Mu^adh bin Jabal, may Allah accept his deeds, who said: I said: O Messenger of Allah inform me about a deed that makes me enter Paradise and keeps  me away from Hellfire. He said:',
      },
      {
        kind: 'text',
        text: '<<You have asked about a great matter which is easy for the one whom Allah willed to make it easy for him. Worship Allah and do not associate anything with Him. Perform the prayers. Pay Zakat. Fast Ramadan and offer pilgrimage to the sacred house.>>',
      },
      {
        kind: 'text',
        text: 'Thereafter He said: <<Should I guide you to the ports of goodness? They are: Fasting and which is like shielding equipment, charity and it puts out the sin as the water extinguishes the fire and the prayer of one in the middle of the night.>> Then he recited:',
      },
      {
        kind: 'arabic',
        text: '{ تَتَجَافَى جُنُوبُهُمْ عَنِ الْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ}',
      },
      {
        kind: 'arabic',
        text: '{َلا تَعْلَمُ نَفْسٌ مَّا أُخْفِيَ لَهُم مِّن قُرَّةِ أَعْيُنٍ جَزَاء بِمَا كَانُوا يَعْمَلُون  }',
      },
      {
        kind: 'text',
        text: 'It Means: [Their sides depart their beds and they make supplication to their Lord in fear and hopefullness, and they spend for the sake of Allah out of the sustenance that we Provided for them. No soul shall come to grips with the delightful enjoyments We have reserved for them as a reward for their good doings.]',
      },
      {
        kind: 'text',
        text: 'Then he said: <<Do not you want me to tell you about the head, backbone and apex of all of that?>> I said: Yes indeed, O Messenger of Allah. He said:',
      },
      {
        kind: 'text',
        text: '<<The head of all of that is Islam and its backbone is the prayers and the apex of it is to struggle for the sake of Allah.>> Then he said: <<Do not you want me to tell you about what makes all of that sound and acceptable?>>',
      },
      {
        kind: 'text',
        text: 'I said: Yes indeed O Prophet of Allah, so he held his tongue and said: <<Protect yourself from this.>>',
      },
      {
        kind: 'text',
        text: 'I said: O Prophet of Allah are we accountable for what we say? He said:',
      },
      {
        kind: 'text',
        text: '<<Alas! Is there anything but the tongue that makes people drop on their faces (or he said: their noses) in hell fire?>> Narrated by at-Tirmidhiyy and he said this Hadith is hasan sahih.',
      },
    ],
  },
  {
    id: 'nawawi-30',
    number: 30,
    title: 'The Thirtieth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Tha^labah al-Khushaniyy Jurthum bin Nashir, may Allah accept his deeds, from the Messenger of Allah , sallallahu ^alayhi wa sallam, who said:',
      },
      {
        kind: 'text',
        text: '<<Allah , the Exalted, decreed obligatory matters so do not waste them, and set parameters so do not violate them, and decreed unlawful matters so do not commit them, and left matters unmentioned about—unforgetful– as a mercy to you so do not fetch them.>>',
      },
      {
        kind: 'text',
        text: 'This Hadith is hasan and narrated by ad-Daraqutniyy and others.',
      },
    ],
  },
  {
    id: 'nawawi-31',
    number: 31,
    title: 'The Thirty First Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu al-^Abbas Sahl bin Sa^d as-Sa^idiyy, may Allah accept his deeds, who said: A man came to the Prophet, sallallahu ^alayhi wa sallam, who said: O Messenger of Allah , guide me to a deed which if I do Allah will Love me (accept my deeds) and the people will love me? He said:',
      },
      {
        kind: 'text',
        text: '<<Lead a hermit like life in this world and Allah will Love you and be humble about what people usually possess and the people will love you.>> This Hadith is hasan and narrated by Ibn Majah and others with hasan chains of narration.',
      },
    ],
  },
  {
    id: 'nawawi-32',
    number: 32,
    title: 'The Thirty Second Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Sa^id Sa^d bin Malik bin Sinan al-Khudriyy, may Allah accept his deeds, who said that the Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<It is unlawful for one to harm another and it is unlawful to harm one another.>>',
      },
      {
        kind: 'text',
        text: 'This Hadith is hasan and narrated by Ibn Majah and ad-Daraqutniyy and others with a Musnad chain of narration (the chain goes back to the Prophet). Malik narrated it in the Muwatta‘ in a Mursal chain of narration from the route of ^Amr bin Yahya from his father from the Prophet, sallallahu ^alayhi wa sallam, and skipped Abu Sa^id and the Hadith has routes of narration which strengthen one another.',
      },
    ],
  },
  {
    id: 'nawawi-33',
    number: 33,
    title: 'The Thirty Third Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Ibn ^Abbas, may Allah accept both of their deeds, who said that the Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<<If people were to be given according to their claims then there would be men who would claim the money of others and that death penalty is due on them. However, the burden of proof is on the plaintiff and the oath is incumbent upon the defendant.>>',
      },
      {
        kind: 'text',
        text: 'This Hadith is hasan and is narrated in the same above stated terminology by al-Bayhaqiyy and others. Part of this terminology is narrated in the two sahih books.',
      },
    ],
  },
  {
    id: 'nawawi-34',
    number: 34,
    title: 'The Thirty Forth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Sa^id al-Khudriyy, may Allah accept his deeds, who said: I heard the messenger of Allah, sallallahu ^alayhi wa sallam, say:',
      },
      {
        kind: 'text',
        text: '<<The one of you who sees an unlawful matter is obligated to change it with his hands, and if unable then with his tongue, and if unable then he is obligated to denounce it in his heart, which is the least that he can do.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-35',
    number: 35,
    title: 'The Thirty Fifth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<< Do not envy one another, and do not cheat one another, and do not hate one another, and do not turn away from one another and do not under sell the concluded sales of one another. O Worshippers of Allah, be brethrens. The Muslim is a brother to the Muslim and does not do him injustice, and does not turn him down, does not lie to him and does not look down upon him. Piety is right in here (pointing thrice to his chest). It is enough evil for one to look down upon his Muslim brother. All that involves a Muslim whether his life, money or elements of integrity (reputation, wife, honor etc…) is unlawful to be violated by another Muslim.>> Narrated by Muslim.',
      },
    ],
  },
  {
    id: 'nawawi-36',
    number: 36,
    title: 'The Thirty Sixth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, from the Prophet, sallallahu ^alayhi wa sallam, who said:',
      },
      {
        kind: 'text',
        text: '<<The one who relieves a Muslim from one of the worldly distressing matters Allah will relieve him from one of the distressing matters of the Hereafter. The one who facilitates the situation of an insolvent person Allah will facilitate his affairs in this world and in the Hereafter. The one who covers the shortcomings of a Muslim Allah will cover his shortcomings in this world and in the Hereafter. Allah will assist the slave so long the slave assists his brother. The one who follows a path seeking knowledge Allah will facilitate a route for him to Paradise. Each time a people gather in one of the sacred houses of Allah, reciting and studying among themselves the book of Allah, peace and blessings will over shower them and the Angels will rub against them and Allah will have them praised among the Angels. The one whose deeds delay him from sound performance shall not rectify his performance with his good lineage.>>',
      },
      {
        kind: 'text',
        text: 'Narrated by Muslim in the aforementioned terminology.',
      },
    ],
  },
  {
    id: 'nawawi-37',
    number: 37,
    title: 'The Thirty Seventh Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Ibn ^Abbas, may Allah accept both of their deeds, from the Messenger of Allah, sallallahu ^alayhi wa sallam, who said, narrating from Allah :',
      },
      {
        kind: 'text',
        text: '<<Allah decreed the good and the bad deeds and made them known so the one who attempts to do a good deed and does not do it, Allah will have it recorded with Him as a complete good deed, and if he attempted to do it and did it , Allah will have it recorded with Him as ten good deeds up to seven hundred folds up to multitudes of folds. If one attempts to commit a bad deed and does not do it, Allah will have it recorded with Him as a complete good deed, and if he attempts to commit it and does it, Allah will have it recorded with Him as one bad deed.>>',
      },
      {
        kind: 'text',
        text: 'Narrated by al-Bukhari and Muslim in their books of as–Sahih in the aforementioned terminology.',
      },
      {
        kind: 'text',
        text: 'An-Nawawi comments the following: “So observe my brother, may Allah guide us and you to goodness, the great generosity of Allah and think about the aforementioned terms. His saying << recorded with Him>> reflects His special care and His saying <<complete>> reflect corroboration and increased special care. He said about committing the bad deed which if one attempts to commit it and does not do it: << Allah will have it recorded with Him as a complete good deed>>, so He corroborated it with the word <<complete>>, and if he does it << Allah will have it recorded with Him as one bad deed>> so He corroborated lessening it with <<one>> and did not corroborate it with <<complete>>. I Praise Allah and express gratitude to Him who is clear from all non befitting attributes while I admit that we are unable to praise Him the Praise that is due to Him. Allah is the One who guides to good endings.”',
      },
    ],
  },
  {
    id: 'nawawi-38',
    number: 38,
    title: 'The Thirty Eighth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Hurayrah, may Allah accept his deeds, who said: the Messenger of Allah, sallallahu ^alayhi wa sallam, said: << Allah , the exalted, said:',
      },
      {
        kind: 'text',
        text: '‘The one who declares enmity upon one of My Waliyys ( highly pious slaves) then let him know that he is declaring war against Me. The one of My slaves will not be able to be closely obedient to Me, in a matter more accepted to Me, than what I had decreed to be obligatory upon him.',
      },
      {
        kind: 'text',
        text: '‘My slave will be diligently engaged in supererogatory acts of worship until I accept him, and if I accept him I will grant him special powers in the hearing with which he hears, the sight with which he sees, the hand with which he touches, the foot with which he walks, and if he asks Me for something I will answer him and if he seeks refuge with Me I will protect him.’ Narrated by al-Bukhari.',
      },
    ],
  },
  {
    id: 'nawawi-39',
    number: 39,
    title: 'The Thirty Ninth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Ibn ^Abbas, may Allah accept both of their deeds, who said: the Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<< Allah does not hold my nation accountable for the errs that they do unintentionally, forgetfully or coerced (threatened by death and the like) into doing.>> This Hadith is hasan and was narrated by Ibn Majah, al-Bayhaqiyy and others.',
      },
    ],
  },
  {
    id: 'nawawi-40',
    number: 40,
    title: 'The Fortieth Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Ibn ^Umar, may Allah accepts both of their deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, held my shoulder and said:',
      },
      {
        kind: 'text',
        text: '<< Be in this life like a stranger or a passer-by.>> Ibn ^Umar, may Allah accepts both of their deeds, used to say:',
      },
      {
        kind: 'text',
        text: '‘If the night befalls you do not await the break of the morning, and if the morning breaks on you do not await the nightfall. Draw on your health for your ill times and on your life for your time of death.’ The Hadith is narrated by al-Bukhari.',
      },
    ],
  },
  {
    id: 'nawawi-41',
    number: 41,
    title: 'The Forty First Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Abu Muhammad ^Abdillah bin ^Amr bin al-^As, may Allah accepts both of their deeds, who said: The Messenger of Allah, sallallahu ^alayhi wa sallam, said:',
      },
      {
        kind: 'text',
        text: '<< The one among you shall not have a complete belief until his inclinations become in conformity to the teachings I brought to you.>>',
      },
      {
        kind: 'text',
        text: 'This Hadith is sahih and I have narrated it in the book of ‘al–Hujjah’ with a sahih chain of narration.',
      },
    ],
  },
  {
    id: 'nawawi-42',
    number: 42,
    title: 'The Forty Second Hadith',
    blocks: [
      {
        kind: 'text',
        text: 'From the route of Anas, may Allah accepts his deeds, who said: I have heard the Messenger of Allah, sallallahu ^alayhi wa sallam, say: << Allah , the Exalted, said:',
      },
      {
        kind: 'text',
        text: '‘O son of Adam, so long as you make supplication to Me and plead with Me with hopefulness, I shall forgive you regardless of your sins. O son of Adam if your sins reach the sky and then you ask for My forgiveness, I shall forgive you.',
      },
      {
        kind: 'text',
        text: 'O son of Adam if you come on the Day of Judgment with sins that almost fill the earth but as a believer, clear of associating partners with Me, I shall reciprocate with forgiveness that almost fill the earth.’',
      },
      {
        kind: 'text',
        text: 'This Hadith was narrated by at-Tirmidhiyy who said: This Hadith is hasan sahih.',
      },
    ],
  },
] as const satisfies readonly NawawiHadithEntry[]);

export function nawawiHadithSearchText(entry: NawawiHadithEntry): string {
  return [
    entry.title,
    String(entry.number),
    NAWAWI_COLLECTION_TITLE,
    NAWAWI_COLLECTION_AUTHOR,
    ...NAWAWI_COLLECTION_AUTHOR_ALIASES,
    ...entry.blocks.map((block) => block.text),
  ]
    .join(' ')
    .toLocaleLowerCase();
}
