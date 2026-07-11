//
//  PersonSegmenter.m
//  TransparentFit
//
//  Objective-C glue that exposes the Swift PersonSegmenter to React Native.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PersonSegmenter, NSObject)

RCT_EXTERN_METHOD(segmentImageBase64:(NSString *)base64
                  withQuality:(NSString *)quality
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
