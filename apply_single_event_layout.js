const fs = require('fs');

let content = fs.readFileSync('src/app/events/[id]/page.tsx', 'utf8');

const anchorTop = '      <div className="max-w-4xl mx-auto px-4 py-8">';
const topIndex = content.indexOf(anchorTop);

const bottomAnchor = '      {showAcceptedModal && (';
let bottomIndex = content.indexOf(bottomAnchor);
if (bottomIndex > topIndex) {
  // Good, we found it. However, we want to include the blank line before it if there is one. We ignore for simplicity and just slice.
} else {
  console.log("Could not find bottom boundary.");
  process.exit(1);
}

if (topIndex === -1 || bottomIndex === -1) {
  console.log("Could not find boundaries.");
  process.exit(1);
}

const beforePart = content.slice(0, topIndex);
const afterPart = content.slice(bottomIndex);

const newLayout = `      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 py-12 border-t mt-4 border-gray-100">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/events"
            className="inline-flex items-center text-[#003399] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm border border-blue-100"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Catalog
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start w-full relative">
          
          {/* LEFT COLUMN: Event Details & Organization */}
          <div className="flex-1 w-full flex flex-col gap-10 order-2 lg:order-1 relative z-10">
            
            {/* Main Specs Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-900/10 p-8 sm:p-10 relative overflow-hidden">
              <h2 className="text-2xl font-extrabold text-[#003399] mb-8 border-b border-gray-100 pb-4">Event Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-10">
                <div className="flex items-start text-gray-700">
                  <Calendar className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Begin Date</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(event.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-start text-gray-700">
                  <Clock className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">End Date</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(event.end_date)}</p>
                  </div>
                </div>
                
                {(event.venue_place || event.city) && (
                  <div className="flex items-start text-gray-700">
                    <MapPin className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Location</p>
                      <p className="text-sm font-bold text-gray-800">
                        {event.venue_place && <span className="block">{event.venue_place}</span>}
                        {event.city && <span className="block">{event.city}</span>}
                      </p>
                    </div>
                  </div>
                )}
                
                {event.country && (
                  <div className="flex items-start text-gray-700">
                    <Globe className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Country</p>
                      <p className="text-sm font-bold text-gray-800">{event.country}</p>
                    </div>
                  </div>
                )}

                {event.group_size && (
                  <div className="flex items-start text-gray-700">
                    <Users className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Group Size</p>
                      <p className="text-sm font-bold text-gray-800">{event.group_size} participants</p>
                    </div>
                  </div>
                )}

                {event.working_language && (
                  <div className="flex items-start text-gray-700">
                    <Languages className="h-6 w-6 mr-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#003399] text-xs uppercase tracking-wider mb-1">Language</p>
                      <p className="text-sm font-bold text-gray-800">{event.working_language}</p>
                    </div>
                  </div>
                )}
              </div>

              {event.is_funded && (
                <div className="mb-10 inline-block">
                  <span className="bg-green-100 text-green-800 px-5 py-2.5 rounded-full text-sm font-extrabold shadow-sm border border-green-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Fully Funded Opportunity
                  </span>
                </div>
              )}

              {event.short_description && (
                <div className="mb-10">
                  <h3 className="text-xl font-extrabold text-[#003399] mb-4">Summary</h3>
                  <p className="text-gray-700 text-lg leading-relaxed font-medium">
                    {event.short_description}
                  </p>
                </div>
              )}

              {event.full_description && (
                <div className="mb-10">
                  <h3 className="text-xl font-extrabold text-[#003399] mb-4">Full Details</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-[1.8] whitespace-pre-wrap break-words border-l-4 border-amber-400 pl-6 bg-amber-50/30 py-6 pr-6 rounded-r-3xl font-medium">
                      {event.full_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Extra Details */}
              {(event.target_groups || event.participation_fee !== null || event.accommodation_food_details || event.transport_details) && (
                <div className="border-t border-gray-100 pt-8 mt-4 space-y-8">
                  {event.target_groups && Array.isArray(event.target_groups) && event.target_groups.length > 0 && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-3 text-amber-500" />
                        Target Groups
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {event.target_groups.map((group, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.participation_fee !== null && event.participation_fee !== undefined && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-3 flex items-center">
                        <DollarSign className="h-5 w-5 mr-3 text-amber-500" />
                        Participation Fee
                      </h4>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 inline-block">
                        <p className="text-gray-800 font-extrabold text-lg">
                          \${typeof event.participation_fee === 'number' ? event.participation_fee.toFixed(2) : '0.00'}
                        </p>
                        {event.participation_fee_reason && (
                          <p className="text-gray-600 font-medium text-sm mt-1 max-w-md">
                            {event.participation_fee_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {event.accommodation_food_details && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-3 flex items-center">
                        <UtensilsCrossed className="h-5 w-5 mr-3 text-amber-500" />
                        Accommodation & Food
                      </h4>
                      <p className="text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {event.accommodation_food_details}
                      </p>
                    </div>
                  )}

                  {event.transport_details && (
                    <div>
                      <h4 className="text-lg font-extrabold text-[#003399] mb-3 flex items-center">
                        <Car className="h-5 w-5 mr-3 text-amber-500" />
                        Transport Arrangements
                      </h4>
                      <p className="text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        {event.transport_details}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Organizator Info */}
            <div className="bg-[#003399] rounded-3xl shadow-xl shadow-blue-900/10 p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden text-center sm:text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
                <User className="h-10 w-10 text-amber-400" />
              </div>
              
              <div className="flex-1 relative z-10">
                <h3 className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-2">Organized By</h3>
                <h4 className="font-extrabold text-white text-2xl sm:text-3xl mb-4">{event.organization_name}</h4>
                {event.organization_website && (
                  <a
                    href={event.organization_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-[#003399] bg-amber-400 hover:bg-amber-300 font-extrabold px-6 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Globe className="h-5 w-5 mr-2" />
                    Visit Official Website
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Hero Photo & Actions (Sticky Layout) */}
          <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col gap-8 order-1 lg:order-2 lg:sticky lg:top-8 z-30 mb-8 lg:mb-0">
            
            {/* Action/Hero Card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-blue-900/5 overflow-hidden flex flex-col relative z-20">
              
              {/* Photo Area */}
              {event.photo_url ? (
                <div className="relative w-full h-[280px] sm:h-[320px] bg-gray-100 group">
                  <Image
                    src={event.photo_url}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/30 to-transparent pointer-events-none"></div>
                  
                  {/* Category on top of image */}
                  {event.category && (
                    <div className="absolute top-6 left-6 z-10">
                      <span className="bg-amber-400 text-amber-950 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase shadow-lg border border-amber-300">
                        {event.category}
                      </span>
                    </div>
                  )}
                  {/* Share button on top of image */}
                  <div className="absolute top-6 right-6 z-10">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-lg hover:scale-110 transition-transform">
                      <ShareOpportunity title={event.title} url={\`/events/\${event.id}\`} type="event" />
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="w-full bg-[#003399] p-6 flex justify-between items-start">
                   {event.category && (
                      <span className="bg-amber-400 text-amber-950 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase shadow-sm">
                        {event.category}
                      </span>
                    )}
                    <div className="bg-white/10 rounded-xl p-1">
                      <ShareOpportunity title={event.title} url={\`/events/\${event.id}\`} type="event" />
                    </div>
                 </div>
              )}

              {/* Title Area */}
              <div className="p-8">
                {event.event_type && (
                  <p className="text-blue-500 font-extrabold text-xs uppercase tracking-widest mb-3">{event.event_type}</p>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003399] leading-tight mb-2">
                  {event.title}
                </h1>
                
                {/* Management Actions */}
                {canManageEvent && (
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Management Options</p>
                    <button
                      onClick={handleOpenAcceptedModal}
                      className="w-full inline-flex items-center justify-center gap-3 bg-blue-50 text-[#003399] font-extrabold px-5 py-3.5 rounded-2xl hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm"
                    >
                      <Users className="h-5 w-5" />
                      List Accepted Participants
                    </button>
                    <button
                      onClick={handleExportParticipantsCsv}
                      disabled={exportingParticipants}
                      className="w-full inline-flex items-center justify-center gap-3 bg-[#003399] text-white font-extrabold px-5 py-3.5 rounded-2xl hover:bg-blue-800 transition-colors border-2 border-[#003399] shadow-md disabled:opacity-50"
                    >
                      {exportingParticipants ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      Export as CSV
                    </button>
                    
                    <div className="flex gap-2 mt-2">
                        <Link
                          href={\`/events/edit/\${event.id}\`}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-gray-700 font-extrabold px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors border-2 border-gray-200 shadow-sm"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                        <button
                          onClick={handleDeleteEvent}
                          disabled={deletingEvent}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 font-extrabold px-4 py-3 rounded-2xl hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
                        >
                          {deletingEvent ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Application Section */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-blue-900/10 p-8 relative overflow-hidden z-20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              {!user ? (
                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-extrabold text-[#003399] mb-3">Apply to Join</h3>
                  <p className="text-gray-600 font-medium mb-8">Create an account or sign in to verify your identity and apply for this opportunity.</p>
                  <Link
                    href="/auth"
                    className="w-full inline-flex items-center justify-center bg-amber-400 text-amber-950 py-4 px-6 rounded-2xl font-extrabold hover:bg-amber-300 transition-all text-lg shadow-md hover:shadow-lg"
                  >
                    Sign In to Apply
                  </Link>
                </div>
              ) : userProfile?.user_type === 'organization' ? (
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-blue-100 text-[#003399] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <User className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#003399] mb-3">Organization Mode</h3>
                  <p className="text-gray-600 font-medium mb-6">
                    Organizations cannot apply to events. Manage your events from the dashboard.
                  </p>
                  <Link
                    href="/dashboard/organization"
                    className="w-full inline-flex items-center justify-center bg-blue-50 text-[#003399] py-3 px-6 rounded-2xl font-extrabold hover:bg-blue-100 transition-all border border-blue-200 shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : application ? (
                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-extrabold text-[#003399] mb-6">Status</h3>
                  <div className="flex flex-col items-center justify-center mb-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4">
                      {getStatusIcon(application.status)}
                    </div>
                    <span className={\`px-5 py-2 rounded-full text-base font-extrabold uppercase tracking-wide shadow-sm \${getStatusColor(application.status)}\`}>
                      {application.status === 'pending' ? 'Under Review' :
                        application.status === 'accepted' ? 'Accepted!' :
                          'Not Selected'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
                    Applied on {formatDate(application.created_at)}
                  </p>
                  
                  {application.status === 'pending' && (
                    <p className="text-[#003399] font-medium bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100 shadow-sm">
                      Your application is being reviewed by the organization.
                    </p>
                  )}
                  {application.status === 'accepted' && (
                    <p className="text-green-800 font-medium bg-green-50 p-4 rounded-xl mb-6 border border-green-200 shadow-sm">
                      🎉 Congratulations! You have been accepted to this event. Check your email for next steps.
                    </p>
                  )}
                  {application.status === 'rejected' && (
                    <p className="text-gray-600 font-medium bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 shadow-sm">
                      Thank you for your interest. Unfortunately, you were not selected this time. Keep applying!
                    </p>
                  )}
                  <Link
                    href="/my-applications"
                    className="w-full inline-flex items-center justify-center text-[#003399] bg-white border-2 border-[#003399] hover:bg-[#003399] hover:text-white py-3 mt-2 rounded-2xl font-extrabold transition-colors shadow-sm"
                  >
                    View All My Applications
                  </Link>
                </div>
              ) : showApplyForm ? (
                <form onSubmit={handleApply} className="space-y-6 relative z-10">
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <h3 className="text-2xl font-extrabold text-[#003399] mb-2">Apply Now</h3>
                    <p className="text-gray-600 font-medium">
                      Tell the organizers why you are the perfect fit for this event.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="motivation-letter" className="block text-xs font-extrabold text-[#003399] uppercase tracking-wider mb-2">
                      Motivation Letter
                    </label>
                    <textarea
                      id="motivation-letter"
                      value={motivationLetter}
                      onChange={(e) => setMotivationLetter(e.target.value)}
                      rows={6}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#003399] resize-none transition-all font-medium text-gray-800 bg-gray-50"
                      placeholder="I am very interested in this opportunity because..."
                      required
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-2 shadow-sm">
                    <p className="text-sm font-medium text-amber-900 leading-relaxed">
                      💡 <strong className="font-extrabold text-amber-950">Tip:</strong> Mention your relevant experience, what you hope to learn, and how this will benefit your community.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 mt-4">
                    <button
                      type="submit"
                      disabled={applying || motivationLetter.trim().length === 0}
                      className="w-full bg-[#003399] text-white py-4 px-6 rounded-2xl font-extrabold hover:bg-blue-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center text-lg z-20"
                    >
                      {applying ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelApply}
                      disabled={applying}
                      className="w-full py-4 rounded-2xl font-extrabold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors z-20"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center relative z-10">
                  <h3 className="text-2xl font-extrabold text-[#003399] mb-4">You&apos;re Eligible</h3>
                  <p className="text-gray-600 font-medium mb-8">
                    Your profile matches the criteria. Ready to join this amazing opportunity?
                  </p>
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="w-full bg-amber-400 text-amber-950 py-4 px-6 rounded-2xl font-extrabold hover:bg-amber-500 hover:shadow-lg transition-all text-lg shadow-md z-20 relative"
                  >
                    Start Application
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>\n`;

content = beforePart + newLayout + afterPart;

fs.writeFileSync('src/app/events/[id]/page.tsx', content);

console.log("Successfully rebuilt the file layout.");
