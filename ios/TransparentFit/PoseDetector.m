//
//  PoseDetector.m
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PoseDetector, NSObject)

RCT_EXTERN_METHOD(detectPoseBase64:(NSString *)base64
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
