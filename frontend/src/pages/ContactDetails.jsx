// ============================================================
// IT Contact Details Page
// ============================================================
import React from 'react';
import { 
    HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, 
    HiOutlineClock, HiOutlineUserGroup, HiOutlineExternalLink 
} from 'react-icons/hi';

const ContactDetails = () => {
    const contacts = [
        {
            title: 'General Support',
            email: 'helpdesk@iitrpr.ac.in',
            phone: '01881-232121',
            extension: '2121',
            icon: HiOutlineMail,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Network & Infrastructure',
            email: 'network@iitrpr.ac.in',
            phone: '01881-232122',
            extension: '2122',
            icon: HiOutlineUserGroup,
            color: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'Software & CMS',
            email: 'cms.support@iitrpr.ac.in',
            phone: '01881-232123',
            extension: '2123',
            icon: HiOutlineExternalLink,
            color: 'bg-emerald-50 text-emerald-600'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto py-10 px-6 animate-fade-in">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">IT Support Section</h1>
                <p className="text-lg text-gray-500 mt-2">Find contact details for various IT services and infrastructure at IIT Ropar.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {contacts.map((contact, index) => (
                    <div key={index} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${contact.color}`}>
                            <contact.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{contact.title}</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <HiOutlineMail className="w-5 h-5 opacity-70" />
                                <a href={`mailto:${contact.email}`} className="text-sm hover:text-primary-600 transition-colors font-medium">
                                    {contact.email}
                                </a>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <HiOutlinePhone className="w-5 h-5 opacity-70" />
                                <div className="text-sm font-medium">
                                    {contact.phone} <span className="text-gray-400 font-normal">(Ext: {contact.extension})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Office Location */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <HiOutlineLocationMarker className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Office Location</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            IT Infrastructure & Services,<br />
                            Main Administration Building, 2nd Floor,<br />
                            IIT Ropar, Rupnagar, Punjab - 140001
                        </p>
                    </div>
                </div>

                {/* Working Hours */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <HiOutlineClock className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Working Hours</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Monday – Friday: 09:00 AM – 05:30 PM<br />
                            Weekend: Closed<br />
                            <span className="text-primary-600 font-medium text-xs uppercase tracking-wider block mt-2">Emergency support available 24/7 for network outages</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-primary-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h4 className="text-xl font-bold mb-1">Facing an issue?</h4>
                    <p className="text-primary-200 opacity-80 text-sm">Raise a ticket to get trackable support from our team.</p>
                </div>
                <a 
                    href="/tickets/new" 
                    className="px-8 py-3 bg-white text-primary-900 rounded-2xl font-bold hover:bg-primary-50 transition-colors shadow-lg"
                >
                    Raise Ticket Now
                </a>
            </div>
        </div>
    );
};

export default ContactDetails;
