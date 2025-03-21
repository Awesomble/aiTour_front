<script setup lang="ts">
import { computed } from 'vue'
import { Clock, DollarSign, MapPin, MessageSquare, ShieldCheck, Users } from 'lucide-vue-next'

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  detail: {
    type: Object,
    require: true
  }
})

</script>

<template>

  <div class="info-sections">
    <!-- 실시간 채팅 배너 -->
    <div class="chat-banner">
      <div class="chat-banner-icon">
        <MessageSquare size="22" />
      </div>
      <div class="chat-banner-content">
        <h3 class="chat-banner-title">실시간 채팅</h3>
        <div class="chat-banner-info">
          <p class="chat-banner-text">대화에 참여하여 크리에이터와 대화하세요</p>
          <div class="chat-meta">
            <span class="chat-participants"><Users size="10" /> 126명</span>
            <span class="manager-badge"><ShieldCheck size="10" /> 담당자 관리중</span>
          </div>
        </div>
      </div>
      <button class="chat-banner-button">패널 열기</button>
    </div>

    <!-- Business hours info -->
    <div class="info-section">
      <div class="info-icon">ⓘ</div>
      <div class="info-content">
        <span class="info-text">영업시간이 잘못되었을 수도 있습니다.</span>
        <span class="info-arrow">▼</span>
      </div>
    </div>

    <!-- Address info -->
    <div class="info-section">
      <div class="info-icon location">
        <MapPin size="20" />
      </div>
      <div class="info-content">
        <span class="info-text">서울특별시 중구 세종대로14길 17-5</span>
      </div>
    </div>

    <!-- Operating hours info -->
    <div class="info-section">
      <div class="info-icon time">
        <Clock size="20" />
      </div>
      <div class="info-content">
        <span class="info-text">영업 중류: 오후 2:00 • 오후 4:00에 영업 재개</span>
        <span class="info-arrow">▼</span>
      </div>
    </div>

    <!-- Price info -->
    <div class="info-section">
      <div class="info-icon price">
        <DollarSign size="20" />
      </div>
      <div class="info-content">
        <span class="info-text">1인당 ₩10,000~20,000</span>
        <span class="info-arrow">▼</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-sections {
  padding: 8px 0;
  background-color: white;
}

.info-section {
  display: flex;
  padding: 16px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.info-icon {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.info-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-text {
  font-size: 14px;
  color: #333;
}

.info-arrow {
  color: #999;
  font-size: 12px;
}

/* 채팅 배너 스타일 */
.chat-banner {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  background-color: white;
  color: #333;
  border-radius: 8px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #eaeaea;
}

.chat-banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f5f9ff;
  border-radius: 50%;
  margin-right: 16px;
  color: #2196f3;
}

.chat-banner-content {
  flex: 1;
}

.chat-banner-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
  display: flex;
  align-items: center;
}

.chat-banner-title::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #4caf50;
  border-radius: 50%;
  margin-left: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.chat-banner-text {
  font-size: 13px;
  margin: 0;
  color: #666;
  line-height: 1.4;
}

.chat-banner-info {
  display: flex;
  flex-direction: column;
}

.chat-meta {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.chat-participants {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  background-color: #f0f7ff;
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 8px;
}

.chat-participants svg {
  margin-right: 3px;
}

.manager-badge {
  display: flex;
  align-items: center;
  font-size: 11px;
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.manager-badge svg {
  margin-right: 3px;
}

.chat-banner-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.chat-banner-button:hover {
  background-color: #1976d2;
}

.info-section-note {
  padding: 8px 16px;
  font-size: 12px;
  color: #999;
}

.suggestion-button {
  display: flex;
  align-items: center;
  padding: 16px;
  color: #009688;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-icon {
  margin-right: 12px;
}

.suggestion-text {
  font-size: 14px;
}

/* Chat Panel Styles */
.chat-panel {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding: 16px;
}

.chat-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.chat-icon {
  font-size: 20px;
  margin-right: 12px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chat-messages {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 0 4px;
}

.chat-message {
  margin-bottom: 12px;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  max-width: 85%;
}

.my-message {
  margin-left: auto;
  background-color: #e3f2fd;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-user {
  font-weight: 600;
  font-size: 13px;
  color: #333;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  word-wrap: break-word;
}

.chat-input {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  overflow: hidden;
  background-color: #fff;
}

.chat-input input {
  flex: 1;
  border: none;
  padding: 12px 16px;
  outline: none;
  font-size: 14px;
}

.send-button {
  background-color: #009688;
  color: white;
  border: none;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
</style>