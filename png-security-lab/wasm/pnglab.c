#include <stdint.h>
static uint32_t W=0,H=0;
static uint32_t rd32(const uint8_t*p){return ((uint32_t)p[0]<<24)|((uint32_t)p[1]<<16)|((uint32_t)p[2]<<8)|p[3];}
static uint32_t crc32c(const uint8_t*d,uint32_t n){uint32_t c=0xffffffffu;for(uint32_t i=0;i<n;i++){c^=d[i];for(int j=0;j<8;j++)c=(c>>1)^(0xedb88320u&-(int)(c&1));}return c^0xffffffffu;}
__attribute__((export_name("png_scan"))) uint32_t png_scan(uint32_t ptr,uint32_t len){W=H=0;const uint8_t*p=(const uint8_t*)(uintptr_t)ptr;static const uint8_t s[8]={0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a};if(len<8)return 2;for(int i=0;i<8;i++)if(p[i]!=s[i])return 1;if(len<33)return 2;uint32_t pos=8,n=rd32(p+pos),typ=rd32(p+pos+4);if(typ!=0x49484452u||n!=13)return 3;if(pos+12+n>len)return 5;uint32_t stored=rd32(p+pos+8+n),calc=crc32c(p+pos+4,4+n);if(stored!=calc)return 4;W=rd32(p+pos+8);H=rd32(p+pos+12);uint8_t bd=p[pos+16],ct=p[pos+17];if(W==0||H==0||bd==0||ct>6)return 6;return 0;}
__attribute__((export_name("png_width"))) uint32_t png_width(void){return W;}
__attribute__((export_name("png_height"))) uint32_t png_height(void){return H;}
__attribute__((export_name("version"))) uint32_t version(void){return 1;}
