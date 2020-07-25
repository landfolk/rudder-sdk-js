import logger from "../../utils/logUtil";

class Optimizely {
  constructor(config, analytics) {
    this.analytics = analytics;
    this.sendExperimentTrack = config.sendExperimentTrack;
    this.sendExperimentIdentify = config.sendExperimentIdentify;
    this.sendExperimentTrackAsNonInteractive =
      config.sendExperimentTrackAsNonInteractive;
    this.revenueOnlyOnOrderCompleted = config.revenueOnlyOnOrderCompleted;
    this.trackCategorizedPages = config.trackCategorizedPages;
    this.customCampaignProperties = config.customCampaignProperties ? config.customCampaignProperties : [];
    this.customExperimentProperties = config.customExperimentProperties ? config.customExperimentProperties : [];
    this.name = "OPTIMIZELY";
  }

  init() {
    logger.debug("=== in optimizely init ===");
    this.initOptimizelyIntegration(
      this.referrerOverride,
      this.sendDataToRudder
    );
  }

  referrerOverride = (referrer) => {
    if (referrer) {
      window.optimizelyEffectiveReferrer = referrer;
      return referrer;
    }
    return undefined;
  }

  sendDataToRudder = (campaignState) => {
    logger.debug(campaignState);
    const { experiment } = campaignState;
    const { variation } = campaignState;
    const context = { integrations: { All: true, Optimizely: false } }; // backward compatibility
    const { audiences } = campaignState;

    // Reformatting this data structure into hash map so concatenating variation ids and names is easier later
    /* const audiencesMap = foldl(
      function (results, audience) {
        const res = results;
        res[audience.id] = audience.name;
        return res;
      },
      {},
      campaignState.audiences
    ); */
    const audiencesMap = {};
    audiences.forEach((audience) => {
      audiencesMap[audience.id] = audience.name;
    });

    const audienceIds = Object.keys(audiencesMap).sort().join(); // Not adding space for backward compat/consistency reasons since all IDs we've never had spaces
    const audienceNames = Object.values(audiencesMap).sort().join(", ");

    if (this.sendExperimentTrack) {
      const props = {
        campaignName: campaignState.campaignName,
        campaignId: campaignState.id,
        experimentId: experiment.id,
        experimentName: experiment.name,
        variationName: variation.name,
        variationId: variation.id,
        audienceId: audienceIds, // eg. '7527562222,7527111138'
        audienceName: audienceNames, // eg. 'Peaky Blinders, Trust Tree'
        isInCampaignHoldback: campaignState.isInCampaignHoldback,
      };

      // If this was a redirect experiment and the effective referrer is different from document.referrer,
      // this value is made available. So if a customer came in via google.com/ad -> tb12.com -> redirect experiment -> Belichickgoat.com
      // `experiment.referrer` would be google.com/ad here NOT `tb12.com`.
      if (experiment.referrer) {
        props.referrer = experiment.referrer;
        context.page = { referrer: experiment.referrer };
      }

      // For Google's nonInteraction flag
      if (this.sendExperimentTrackAsNonInteractive) props.nonInteraction = 1;

      // If customCampaignProperties is provided overide the props with it.
      // If valid customCampaignProperties present it will override existing props.
      // const { customCampaignProperties } = this.options;
      // const customPropsKeys = Object.keys(this.customCampaignProperties);
      const data = window.optimizely && window.optimizely.get("data");
      if (data && this.customCampaignProperties.length > 0) {
        for (
          let index = 0;
          index < this.customCampaignProperties.length;
          index += 1
        ) {
          const rudderProp = this.customCampaignProperties[index].from;
          const optimizelyProp = this.customCampaignProperties[index].to;
          if (typeof data[optimizelyProp] !== "undefined") {
            props[rudderProp] = data[optimizelyProp];
          }
        }
      }

      // Send to Rudder
      this.analytics.track("Experiment Viewed", props, context);
    }
  }

  initOptimizelyIntegration(referrerOverride, sendCampaignData) {
    const newActiveCampaign = (id, referrer) => {
      const state = window.optimizely.get && window.optimizely.get("state");
      if (state) {
        const activeCampaigns = state.getCampaignStates({
          isActive: true,
        });
        const campaignState = activeCampaigns[id];
        // Segment added code: in case this is a redirect experiment
        if (referrer) campaignState.experiment.referrer = referrer;
        sendCampaignData(campaignState);
      }
    };

    const checkReferrer = () => {
      const state = window.optimizely.get && window.optimizely.get("state");
      if (state) {
        const referrer =
          state.getRedirectInfo() && state.getRedirectInfo().referrer;

        if (referrer) {
          referrerOverride(referrer);
          return referrer;
        }
      }
      return undefined;
    };

    const registerFutureActiveCampaigns = () => {
      window.optimizely = window.optimizely || [];
      window.optimizely.push({
        type: "addListener",
        filter: {
          type: "lifecycle",
          name: "campaignDecided",
        },
        handler(event) {
          const { id } = event.data.campaign;
          newActiveCampaign(id);
        },
      });
    };

    const registerCurrentlyActiveCampaigns = () => {
      window.optimizely = window.optimizely || [];
      const state = window.optimizely.get && window.optimizely.get("state");
      if (state) {
        const referrer = checkReferrer();
        const activeCampaigns = state.getCampaignStates({
          isActive: true,
        });
        /* Object.keys(activeCampaigns).forEach((id) => {
          if (referrer) {
            newActiveCampaign(id, referrer);
          } else {
            newActiveCampaign(id);
          }
        }); */
        for (var id in activeCampaigns) {
            if ({}.hasOwnProperty.call(activeCampaigns, id)) {
              // Segment modified code: need to pass down referrer in the cb for backward compat reasons
              if (referrer) {
                newActiveCampaign(id, referrer);
              } else {
                newActiveCampaign(id);
              }
            }
          }
      } else {
        window.optimizely.push({
          type: "addListener",
          filter: {
            type: "lifecycle",
            name: "initialized",
          },
          handler() {
            checkReferrer();
          },
        });
      }
    };
    registerCurrentlyActiveCampaigns();
    registerFutureActiveCampaigns();
  }

  track(rudderElement) {
    logger.debug("in Optimizely web track");
    const eventProperties = rudderElement.message.properties;
    const { event } = rudderElement.message;
    if (eventProperties.revenue && this.revenueOnlyOnOrderCompleted) {
      if (event === "Order Completed") {
        eventProperties.revenue = Math.round(eventProperties.revenue * 100);
      } else if (event !== "Order Completed") {
        delete eventProperties.revenue;
      }
    }
    const eventName = event.replace(/:/g, "_"); // can't have colons so replacing with underscores
    const payload = {
      type: "event",
      eventName,
      tags: eventProperties,
    };

    window.optimizely.push(payload);
  }

  page(rudderElement) {
    logger.debug("in Optimizely web page");
    const { category } = rudderElement.message.properties;
    const { name } = rudderElement.message;
    const contextOptimizely = {
      integrations: { All: false, Optimizely: true },
    };

    // categorized pages
    if (category && this.trackCategorizedPages) {
      // this.analytics.track(`Viewed ${category} page`, {}, contextOptimizely);
      rudderElement.message.event = `Viewed ${category} page`;
      rudderElement.message.type = "track";
      this.track(rudderElement);
    }

    // named pages
    if (name && this.trackNamedPages) {
      this.analytics.track(`Viewed ${name} page`, {}, contextOptimizely);
    }
  }

  isLoaded() {
    return !!(
      window.optimizely && window.optimizely.push !== Array.prototype.push
    );
  }

  isReady() {
    return !!(
      window.optimizely && window.optimizely.push !== Array.prototype.push
    );
  }
}

export { Optimizely };