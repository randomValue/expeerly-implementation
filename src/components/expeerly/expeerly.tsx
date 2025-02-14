import { Component, Prop, State, h } from '@stencil/core';


@Component({
  tag: 'expeerly-component',
  //styleUrl: 'expeerly-component.css',
  shadow: true,
})
export class ExpeerlyComponent {
  @Prop() gtin: string;
  @Prop() type: 'badge' | 'reviewblock' | 'carousel' = 'reviewblock';
  @Prop() maxVideos: number = 999;
  @Prop() theme: string = 'dark';
  @Prop() storeId: string = '';
  @Prop() accentColor: string = '#4B49EB';

  @State() loading: boolean = true;
  @State() errorMessage: string = '';
  @State() reviews: any[] = [];

  private apiUrl: string;

  componentWillLoad() {
    this.loadReviews();
  }

  async loadReviews() {
    if (!this.gtin) {
      this.errorMessage = "Expeerly: Missing data-gtin attribute.";
      this.loading = false;
      return;
    }

    this.apiUrl = `https://app.expeerly.com/api/1.1/wf/get-product-videos-processed/?gtin=${encodeURIComponent(this.gtin)}`;

    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();

      if (!data || data.status !== "success" || !data.response || !Array.isArray(data.response.videos)) {
        this.errorMessage = "No Expeerly reviews available.";
        this.loading = false;
        return;
      }

      const reviews = data.response.videos.slice(0, this.maxVideos);
      if (reviews.length === 0) {
        this.errorMessage = "No Expeerly reviews found for this product.";
        this.loading = false;
        return;
      }

      this.reviews = reviews;
    } catch (error) {
      this.errorMessage = "Error fetching reviews.";
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return <div style={{ fontFamily: 'Mulish,sans-serif' }}>Loading Expeerly reviews...</div>;
    }

    if (this.errorMessage) {
      return <div>{this.errorMessage}</div>;
    }

    // Render based on type

    switch (this.type) {
      case 'badge':
        return  this.renderBadge({
          theme: this.theme,
          expeerlyLogo: this.getExpeerlyLogo(),
          avgRating: this.calculateAvgRating(),
          totalReviews: this.reviews.length,
        });
      case 'reviewblock':
        return this.renderReviewBlock({
          theme: this.theme,
          expeerlyLogo: this.getExpeerlyLogo(),
          accentColor: this.accentColor,
          reviews: this.reviews,
          avgRating: this.calculateAvgRating(),
          avgRatingStr: this.calculateAvgRating().toString(),
          totalReviews: this.reviews.length,
          reviewLabel: this.calculateAvgRating() === 1 ? 'Review' : 'Reviews', // Adjust as needed
          footerLabel: "Footer text here", // Replace with actual footer label logic
        });
      case 'carousel':
        return this.renderCarousel({
          reviews: this.reviews,
          storeId: this.storeId,
        });
    }

    

  }

  renderBadge({ theme, expeerlyLogo, avgRating, totalReviews }) {
    const bg = theme === "dark" ? "#2C1277" : "#FFFFFF";
    const fg = theme === "dark" ? "#FFFFFF" : "#000000";
    const logoHeight = theme === "minimal" ? "24px" : "48px";

    return (
      <div
        class="expeerly--badge"
        style={{
          fontFamily: 'Mulish,sans-serif',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: bg,
          color: fg,
          borderRadius: '9999px',
          marginTop: '10px',
          cursor: 'pointer',
          justifyContent: 'space-between'
        }}
      >
        <img src={expeerlyLogo} alt="Expeerly Reviewed" style={{ height: logoHeight }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: '600' }}>{avgRating}</span>
          {this.renderStarsInline(avgRating)}
          <span style={{ color:'#FA0F9C', fontSize:'0.85rem' }}>({totalReviews})</span>
        </div>
      </div>
    );
  }

   renderReviewBlock({ theme, expeerlyLogo, accentColor, reviews, avgRating, avgRatingStr, totalReviews, reviewLabel, footerLabel }) {
     const blockBg = theme === "dark" ? "#2C1277" : "#FFFFFF"; // Background color based on theme
     const blockFg = theme === "dark" ? "#FFFFFF" : "#000000"; // Text color based on theme
     const logoHeight = theme === "minimal" ? "24px" : "60px"; // Logo height based on theme

     return (
       <div class="expeerly--reviewblock" style={{ fontFamily:'Mulish,sans-serif', margin:'20px auto', padding:'10px' }}>

         {/* Header with background */}
         <div style={{ background:blockBg, color:blockFg, padding:'8px', borderRadius:'8px', marginBottom:'8px', maxWidth:'300px' }}>

             <img src={expeerlyLogo} alt="Expeerly Logo" style={{ height: logoHeight }} />
             <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px' }}>
               <div style={{ fontSize:'14px', fontWeight:'bold' }}>{avgRatingStr}</div>
               <div style={{ display:'inline-flex', alignItems:'center' }}>{this.renderStarsInline(avgRating)}</div>
               <span style={{ color:'#ff0080' }}>({totalReviews} {reviewLabel})</span>
             </div>

         </div>

         {/* The reviews themselves in a horizontal scroll */}
         <div style={{ display:'flex', gap:'16px', overflowX:'auto' }}>
             {reviews.map((r) => this.renderReviewItem(r)).join("")}
         </div>

         {/* Footer text */}
         <div style={{ marginTop:'12px', fontSize:'14px', color:`${accentColor}` }}>
             <p>{footerLabel}</p>
         </div>

       </div>
     );
   }

   renderCarousel({ reviews, storeId }) {
     return (
       <div class="expeerly--carousel" style={{ fontFamily:'Mulish,sans-serif', margin:'20px auto', padding:'10px', borderRadius:'6px' }}>

         {/* The reviews in some layout */}
         <div style={{ display:'flex', gap:'16px', overflowX:'auto' }}>
           {reviews.map((rev) => {
             const playbackId = rev.mux_playback_id_text || "";
             return (
               <div class="expeerly--slide" 
                    style={{
                      position:"relative", 
                      width:"180px", 
                      height:"320px", 
                      borderRadius:"8px", 
                      overflow:"hidden", 
                      flexShrink:"0"
                    }}>
                 {playbackId ? (
                   <mux-player playback-id={playbackId} stream-type="on-demand" controls muted data-store-id={storeId} 
                               style={{ width:"100%", height:"100%", objectFit:"cover"}}></mux-player>
                 ) : (
                   <div style={{
                     width:"100%", 
                     height:"100%", 
                     background:"#ccc", 
                     display:"flex", 
                     alignItems:"center", 
                     justifyContent:"center"
                   }}>No video</div>
                 )}
               </div>
             );
           })}
         </div>

       </div>
     );
   }

   renderStarsInline(avgRating) {
     // Implement your star rendering logic here
     const starsCount = Math.round(avgRating);
     let starsHtml = [];
     for(let i=0; i<5; i++) {
       starsHtml.push(<span>{i < starsCount ? '★' : '☆'}</span>);
     }
     return (<span>{starsHtml}</span>);
   }

   renderReviewItem(reviewData) {
     // Implement your review item rendering logic here
     // Example:
     return (
       <div class="review-item">
         {/* Customize according to your review structure */}
         <p>{reviewData.title}</p> 
         {/* Add more fields as necessary */}
       </div>
     );
   }

   getExpeerlyLogo() {
     let logoUrl =
       "https://www.expeerly.com/expeerly_reviewed_icon_DARK.svg"; // default
     if (this.theme === "light") {
       logoUrl =
         "https://www.expeerly.com/expeerly_reviewed_icon_LIGHT.svg";
     } else if (this.theme === "minimal") {
       logoUrl =
         "https://www.expeerly.com/expeerly_reviewed_MINIMAL.svg";
     }

     return logoUrl;
   }

   calculateAvgRating() {
     let sumRating = 0;
     let ratingCount = 0;

     for (const rev of this.reviews) {
       if (typeof rev.rating_number === "number" && rev.rating_number > 0) {
         sumRating += rev.rating_number;
         ratingCount++;
       }
     }

     return ratingCount > 0 ? parseFloat((Math.round((sumRating / ratingCount) * 10) / 10).toFixed(1)) : 0;
   }
}