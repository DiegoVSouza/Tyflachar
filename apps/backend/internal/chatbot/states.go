package chatbot

const (
	StateStart           = "start"
	StateMainMenu        = "main_menu"
	StateChoosingService = "choosing_service"
	StateChoosingSlot    = "choosing_slot"
	StateConfirming      = "confirming_appointment"
	StateDone            = "done"
)

const (
	BtnSchedule    = "btn_schedule"
	BtnViewSlots   = "btn_view_slots"
	BtnTalkToAgent = "btn_talk_to_agent"
	BtnConfirmYes  = "btn_confirm_yes"
	BtnConfirmNo   = "btn_confirm_no"

	// Period values match what is stored in the available_slots.period DB column.
	PeriodMorning   = "morning"
	PeriodAfternoon = "afternoon"
	PeriodEvening   = "evening"
)
