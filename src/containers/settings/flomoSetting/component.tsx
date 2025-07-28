import React from "react";
import { FlomoSettingProps, FlomoSettingState } from "./interface";
import { ConfigService } from "../../../assets/lib/kookit-extra-browser.min";
import { Trans } from "react-i18next";
import toast from "react-hot-toast";
import { FlomoService } from "../../../utils/service/flomoService";
import "./flomoSetting.css";

class FlomoSetting extends React.Component<
  FlomoSettingProps,
  FlomoSettingState
> {
  constructor(props: FlomoSettingProps) {
    super(props);
    this.state = {
      isEnableFlomo: ConfigService.getReaderConfig("isEnableFlomo") === "yes",
      flomoWebhookUrl: ConfigService.getReaderConfig("flomoWebhookUrl") || "",
      isTesting: false,
    };
  }

  handleEnableFlomo = () => {
    const newValue = !this.state.isEnableFlomo;
    this.setState({ isEnableFlomo: newValue });
    ConfigService.setReaderConfig("isEnableFlomo", newValue ? "yes" : "no");
    toast.success(this.props.t("Change successful"));
  };

  handleWebhookUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    this.setState({ flomoWebhookUrl: url });
  };

  handleSaveWebhookUrl = () => {
    const { flomoWebhookUrl } = this.state;
    
    if (flomoWebhookUrl.trim() === "") {
      ConfigService.setReaderConfig("flomoWebhookUrl", "");
      toast.success(this.props.t("Webhook URL cleared"));
      return;
    }

    const flomoService = FlomoService.getInstance();
    if (!flomoService.validateWebhookUrl(flomoWebhookUrl)) {
      toast.error(this.props.t("Invalid webhook URL format. Please check your URL."));
      return;
    }

    ConfigService.setReaderConfig("flomoWebhookUrl", flomoWebhookUrl);
    toast.success(this.props.t("Webhook URL saved successfully"));
  };

  handleTestConnection = async () => {
    const { flomoWebhookUrl } = this.state;
    
    if (!flomoWebhookUrl.trim()) {
      toast.error(this.props.t("Please enter a webhook URL first"));
      return;
    }

    this.setState({ isTesting: true });

    try {
      const flomoService = FlomoService.getInstance();
      const result = await flomoService.testConnection(flomoWebhookUrl);
      
      if (result.success) {
        toast.success(result.message || this.props.t("Connection test successful"));
      } else {
        toast.error(result.error || this.props.t("Connection test failed"));
      }
    } catch (error) {
      console.error("Test connection error:", error);
      toast.error(this.props.t("An error occurred during connection test"));
    } finally {
      this.setState({ isTesting: false });
    }
  };

  render() {
    const { isEnableFlomo, flomoWebhookUrl, isTesting } = this.state;

    return (
      <div className="flomo-setting-container">
        <div className="setting-dialog-new-title">
          <Trans>flomo Integration</Trans>
        </div>
        
        {/* Enable flomo toggle */}
        <div className="single-control-switch-container">
          <div className="single-control-switch-title">
            <Trans>Enable flomo integration</Trans>
          </div>
          <span
            className="single-control-switch"
            onClick={this.handleEnableFlomo}
            style={isEnableFlomo ? {} : { opacity: 0.6 }}
          >
            <span
              className="single-control-button"
              style={
                isEnableFlomo
                  ? {
                      transform: "translateX(20px)",
                      transition: "transform 0.5s ease",
                    }
                  : {
                      transform: "translateX(0px)",
                      transition: "transform 0.5s ease",
                    }
              }
            ></span>
          </span>
        </div>
        <p className="setting-option-subtitle">
          <Trans>Enable this option to export highlights to your flomo account</Trans>
        </p>

        {/* Webhook URL configuration */}
        <div className="setting-dialog-new-title" style={{ marginTop: "20px" }}>
          <Trans>Webhook Configuration</Trans>
        </div>
        
        <div className="flomo-webhook-container">
          <div className="flomo-webhook-input-container">
            <label className="flomo-webhook-label">
              <Trans>flomo Webhook URL</Trans>
            </label>
            <input
              type="text"
              className="flomo-webhook-input"
              value={flomoWebhookUrl}
              onChange={this.handleWebhookUrlChange}
              placeholder="https://flomoapp.com/mine/..."
              disabled={!isEnableFlomo}
            />
          </div>
          
          <div className="flomo-webhook-buttons">
            <button
              className="flomo-webhook-button flomo-save-button"
              onClick={this.handleSaveWebhookUrl}
              disabled={!isEnableFlomo}
            >
              <Trans>Save</Trans>
            </button>
            
            <button
              className="flomo-webhook-button flomo-test-button"
              onClick={this.handleTestConnection}
              disabled={!isEnableFlomo || !flomoWebhookUrl.trim() || isTesting}
            >
              {isTesting ? <Trans>Testing...</Trans> : <Trans>Test Connection</Trans>}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="flomo-instructions">
          <div className="setting-dialog-new-title" style={{ marginTop: "20px" }}>
            <Trans>How to get your flomo webhook URL</Trans>
          </div>
          <ol className="flomo-instructions-list">
            <li>
              <Trans>Visit</Trans>{" "}
              <a 
                href="https://flomoapp.com/mine?source=incoming_webhook" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flomo-link"
              >
                flomo webhook settings
              </a>
            </li>
            <li><Trans>Copy your unique webhook URL</Trans></li>
            <li><Trans>Paste it in the field above and click Save</Trans></li>
            <li><Trans>Use Test Connection to verify the setup</Trans></li>
          </ol>
          
          <div className="flomo-note">
            <strong><Trans>Note:</Trans></strong>{" "}
            <Trans>
              You need a flomo PRO account to use the webhook feature. 
              The webhook URL should start with https://flomoapp.com/mine/
            </Trans>
          </div>
        </div>
      </div>
    );
  }
}

export default FlomoSetting;
